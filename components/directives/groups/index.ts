// Import YAML group loader
import { registerYamlGroup } from "@/lib/yamlGroupEditor/loader";

// Import YAML files as raw text
import javaYaml from "./java.yaml?raw";
import shellScriptYaml from "./shellScript.yaml?raw";
import pipRequirementsYaml from "./pipRequirements.yaml?raw";
import minicondaYamlYaml from "./minicondaYaml.yaml?raw";

// Register each YAML group
registerYamlGroup(javaYaml);
registerYamlGroup(shellScriptYaml);
registerYamlGroup(pipRequirementsYaml);
registerYamlGroup(minicondaYamlYaml);
