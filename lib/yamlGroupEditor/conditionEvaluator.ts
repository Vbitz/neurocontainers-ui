/**
 * Condition evaluation system for YAML group editors
 * Uses a proper recursive descent parser for robust expression evaluation
 */

export interface EvaluationContext {
    [key: string]: unknown;
}

// Token types for the lexer
enum TokenType {
    IDENTIFIER = 'IDENTIFIER',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    DOT = 'DOT',
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    EOF = 'EOF',
    WHITESPACE = 'WHITESPACE'
}

interface Token {
    type: TokenType;
    value: string;
    position: number;
}

// AST Node types
interface ASTNode {
    type: string;
}

interface BinaryOpNode extends ASTNode {
    type: 'binary';
    operator: '==' | '!=' | '&&' | '||';
    left: ASTNode;
    right: ASTNode;
}

interface UnaryOpNode extends ASTNode {
    type: 'unary';
    operator: '!';
    operand: ASTNode;
}

interface IdentifierNode extends ASTNode {
    type: 'identifier';
    name: string;
}

interface PropertyAccessNode extends ASTNode {
    type: 'property';
    object: string;
    property: string;
}

interface LiteralNode extends ASTNode {
    type: 'literal';
    value: string | number | boolean;
}

type ExpressionNode = BinaryOpNode | UnaryOpNode | IdentifierNode | PropertyAccessNode | LiteralNode;

/**
 * Tokenizes the input condition string
 */
function tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;

    while (position < input.length) {
        const char = input[position];
        
        // Skip whitespace
        if (/\s/.test(char)) {
            position++;
            continue;
        }
        
        // String literals
        if (char === '"') {
            let value = '';
            position++; // Skip opening quote
            while (position < input.length && input[position] !== '"') {
                value += input[position];
                position++;
            }
            if (position >= input.length) {
                throw new Error('Unterminated string literal');
            }
            position++; // Skip closing quote
            tokens.push({ type: TokenType.STRING, value, position: position - value.length - 2 });
            continue;
        }
        
        // Numbers
        if (/\d/.test(char)) {
            let value = '';
            while (position < input.length && /[\d.]/.test(input[position])) {
                value += input[position];
                position++;
            }
            tokens.push({ type: TokenType.NUMBER, value, position: position - value.length });
            continue;
        }
        
        // Identifiers and keywords
        if (/[a-zA-Z_]/.test(char)) {
            let value = '';
            while (position < input.length && /[a-zA-Z0-9_]/.test(input[position])) {
                value += input[position];
                position++;
            }
            
            // Check for boolean literals
            if (value === 'true' || value === 'false') {
                tokens.push({ type: TokenType.BOOLEAN, value, position: position - value.length });
            } else {
                tokens.push({ type: TokenType.IDENTIFIER, value, position: position - value.length });
            }
            continue;
        }
        
        // Two-character operators
        if (position + 1 < input.length) {
            const twoChar = input.substring(position, position + 2);
            if (twoChar === '==') {
                tokens.push({ type: TokenType.EQUALS, value: '==', position });
                position += 2;
                continue;
            }
            if (twoChar === '!=') {
                tokens.push({ type: TokenType.NOT_EQUALS, value: '!=', position });
                position += 2;
                continue;
            }
            if (twoChar === '&&') {
                tokens.push({ type: TokenType.AND, value: '&&', position });
                position += 2;
                continue;
            }
            if (twoChar === '||') {
                tokens.push({ type: TokenType.OR, value: '||', position });
                position += 2;
                continue;
            }
        }
        
        // Single character tokens
        switch (char) {
            case '.':
                tokens.push({ type: TokenType.DOT, value: '.', position });
                break;
            case '!':
                tokens.push({ type: TokenType.NOT, value: '!', position });
                break;
            case '(':
                tokens.push({ type: TokenType.LPAREN, value: '(', position });
                break;
            case ')':
                tokens.push({ type: TokenType.RPAREN, value: ')', position });
                break;
            default:
                throw new Error(`Unexpected character '${char}' at position ${position}`);
        }
        position++;
    }
    
    tokens.push({ type: TokenType.EOF, value: '', position });
    return tokens;
}

/**
 * Recursive descent parser for condition expressions
 */
class ExpressionParser {
    private tokens: Token[];
    private current = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): ExpressionNode {
        const expr = this.parseOrExpression();
        if (!this.isAtEnd()) {
            const token = this.peek();
            throw new Error(`Unexpected token '${token.value}' at position ${token.position}`);
        }
        return expr;
    }

    private parseOrExpression(): ExpressionNode {
        let expr = this.parseAndExpression();

        while (this.match(TokenType.OR)) {
            const operator = '||' as const;
            const right = this.parseAndExpression();
            expr = { type: 'binary', operator, left: expr, right };
        }

        return expr;
    }

    private parseAndExpression(): ExpressionNode {
        let expr = this.parseEqualityExpression();

        while (this.match(TokenType.AND)) {
            const operator = '&&' as const;
            const right = this.parseEqualityExpression();
            expr = { type: 'binary', operator, left: expr, right };
        }

        return expr;
    }

    private parseEqualityExpression(): ExpressionNode {
        let expr = this.parseUnaryExpression();

        while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
            const token = this.previous();
            const operator = token.type === TokenType.EQUALS ? '==' as const : '!=' as const;
            const right = this.parseUnaryExpression();
            expr = { type: 'binary', operator, left: expr, right };
        }

        return expr;
    }

    private parseUnaryExpression(): ExpressionNode {
        if (this.match(TokenType.NOT)) {
            const operator = '!' as const;
            const operand = this.parseUnaryExpression();
            return { type: 'unary', operator, operand };
        }

        return this.parsePrimaryExpression();
    }

    private parsePrimaryExpression(): ExpressionNode {
        if (this.match(TokenType.BOOLEAN)) {
            const value = this.previous().value === 'true';
            return { type: 'literal', value };
        }

        if (this.match(TokenType.STRING)) {
            const value = this.previous().value;
            return { type: 'literal', value };
        }

        if (this.match(TokenType.NUMBER)) {
            const value = parseFloat(this.previous().value);
            return { type: 'literal', value };
        }

        if (this.match(TokenType.IDENTIFIER)) {
            const name = this.previous().value;
            
            // Check for property access (e.g., local.variableName)
            if (this.match(TokenType.DOT)) {
                if (!this.match(TokenType.IDENTIFIER)) {
                    throw new Error('Expected property name after dot');
                }
                const property = this.previous().value;
                return { type: 'property', object: name, property };
            }
            
            return { type: 'identifier', name };
        }

        if (this.match(TokenType.LPAREN)) {
            const expr = this.parseOrExpression();
            if (!this.match(TokenType.RPAREN)) {
                throw new Error('Expected closing parenthesis');
            }
            return expr;
        }

        const token = this.peek();
        throw new Error(`Unexpected token '${token.value}' at position ${token.position}`);
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }
}

/**
 * Evaluates an AST node against the given context and returns the raw value
 */
function evaluateNodeValue(node: ExpressionNode, context: EvaluationContext): unknown {
    switch (node.type) {
        case 'identifier': {
            const identifierNode = node as IdentifierNode;
            return context[identifierNode.name];
        }

        case 'property': {
            const propertyNode = node as PropertyAccessNode;
            if (propertyNode.object === 'local') {
                return context[propertyNode.property];
            }
            throw new Error(`Unknown object: ${propertyNode.object}`);
        }

        case 'literal': {
            const literalNode = node as LiteralNode;
            return literalNode.value;
        }

        default:
            throw new Error(`Cannot evaluate value for node type: ${node.type}`);
    }
}

/**
 * Evaluates an AST node against the given context and returns a boolean
 */
function evaluateNode(node: ExpressionNode, context: EvaluationContext): boolean {
    switch (node.type) {
        case 'binary': {
            const binaryNode = node as BinaryOpNode;
            
            // For logical operators, evaluate as booleans
            if (binaryNode.operator === '&&' || binaryNode.operator === '||') {
                const left = evaluateNode(binaryNode.left as ExpressionNode, context);
                const right = evaluateNode(binaryNode.right as ExpressionNode, context);
                
                switch (binaryNode.operator) {
                    case '&&':
                        return left && right;
                    case '||':
                        return left || right;
                }
            }
            
            // For comparison operators, evaluate as values and then compare
            const leftValue = evaluateNodeValue(binaryNode.left as ExpressionNode, context);
            const rightValue = evaluateNodeValue(binaryNode.right as ExpressionNode, context);
            
            switch (binaryNode.operator) {
                case '==':
                    return leftValue === rightValue;
                case '!=':
                    return leftValue !== rightValue;
                default:
                    throw new Error(`Unknown binary operator: ${binaryNode.operator}`);
            }
        }

        case 'unary': {
            const unaryNode = node as UnaryOpNode;
            const operand = evaluateNode(unaryNode.operand as ExpressionNode, context);
            if (unaryNode.operator === '!') {
                return !operand;
            }
            throw new Error(`Unknown unary operator: ${unaryNode.operator}`);
        }

        case 'identifier': {
            const identifierNode = node as IdentifierNode;
            const value = context[identifierNode.name];
            return Boolean(value);
        }

        case 'property': {
            const propertyNode = node as PropertyAccessNode;
            if (propertyNode.object === 'local') {
                const propertyValue = context[propertyNode.property];
                return Boolean(propertyValue);
            }
            throw new Error(`Unknown object: ${propertyNode.object}`);
        }

        case 'literal': {
            const literalNode = node as LiteralNode;
            if (typeof literalNode.value === 'boolean') {
                return literalNode.value;
            }
            // For non-boolean literals in boolean context, convert to boolean
            return Boolean(literalNode.value);
        }

        default:
            throw new Error(`Unknown node type: ${(node as { type: string }).type}`);
    }
}

/**
 * Evaluates a condition string against the given context using proper parsing
 */
export function evaluateCondition(
    condition: string,
    context: EvaluationContext
): boolean {
    if (!condition || condition.trim() === '') {
        return true; // Empty condition is always true
    }

    try {
        const tokens = tokenize(condition.trim());
        const parser = new ExpressionParser(tokens);
        const ast = parser.parse();
        return evaluateNode(ast, context);
    } catch (error) {
        throw new Error(`Error evaluating condition "${condition}": ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Validates that a condition string has valid syntax
 */
export function validateConditionSyntax(condition: string): boolean {
    try {
        const tokens = tokenize(condition.trim());
        const parser = new ExpressionParser(tokens);
        parser.parse();
        return true;
    } catch {
        return false;
    }
}