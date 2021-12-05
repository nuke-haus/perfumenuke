PN = {};
PN.activeFormula = {};
PN.errors = [];
PN.warnings = [];

PN.database = {};
PN.database.mixtures = [];
PN.database.materials = [];

PN.note = {};
PN.note.top = "TOP";
PN.note.mid = "HEART";
PN.note.base = "BASE";

PN.validateLoadedMaterials = function(materials) {
    for (let material of materials) {
        material.ifra_restricted = ((material.ifra_restricted || "").toLowerCase().trim() === "true");
        material.solvent = ((material.solvent || "").toLowerCase().trim() === "true");
        material.note = PN.interpretNote(material.note);
    
        if (material.id == null) {
            PN.errors.push("Material is missing an ID!");
            continue;
        }
        if (material.name == null) {
            PN.errors.push("Material is missing a name: " + material.id);
            continue;
        }
        if (material.solvent === true) { // Solvents don't need to be validated totally
            if (material.usage == null) {
                PN.warnings.push("Material is missing usage notes:" + material.id);
            }
            PN.database.materials.push(material);
            continue;
        }
        if (material.cas == null) {
            PN.errors.push("Material is missing a CAS number: " + material.id);
            continue;
        }
        if (material.ifra_restricted === true && material.max_in_finished_product == null) {
            PN.errors.push("Material is IFRA restricted but is missing its maximum allowance in finished product value: " + material.id);
            continue;
        }
        if (material.note !== PN.note.top && material.note !== PN.note.mid && material.note !== PN.note.base) {
            PN.errors.push("Material note type is invalid: " + material.id);
            continue;
        }
        if (material.scent == null) {
            PN.warnings.push("Material is missing a scent description:" + material.id);
        }
        if (material.usage == null) {
            PN.warnings.push("Material is missing usage notes:" + material.id);
        }
    
        PN.database.materials.push(material);
    }
}

PN.validateLoadedMixtures = function(mixtures) {
    for (let mixture of mixtures) {
        if (mixture.id == null) {
            PN.errors.push("Mixture is missing an ID!");
            continue;
        }
        if (mixture.name == null) {
            PN.errors.push("Mixture is missing a name: " + mixture.id);
            continue;
        }
        if (mixture.materials == null) {
            PN.warnings.push("Mixture is missing a material list: " + mixture.id);
            continue;
        }
        let materialsValid = true;
        for (let material of mixture.materials) {
            material.percentage = parseFloat(material.percentage || "10.0");
            if (material.id == null || PN.getMaterial(material.id) == null || material.percentage < 0.0 || material.percentage >= 1.0) {
                PN.errors.push("Mixture has invalid material data: " + mixture.id);
                materialsValid = false;
                break; 
            }
        }
        if (!materialsValid) {
            continue;
        }
        if (mixture.scent == null) {
            PN.warnings.push("Mixture is missing a scent description:" + mixture.id);
        }
        if (mixture.usage == null) {
            PN.warnings.push("Mixture is missing usage notes:" + mixture.id);
        }
        
        PN.database.mixtures.push(mixture);
    }
}

PN.interpretNote = function(note) {
    note = (note || "").toUpperCase().trim();
    if (note === PN.note.top) {
        return PN.note.top;
    } else if (note === PN.note.mid || note === "MID" || note === "MIDDLE") {
        return PN.note.mid;
    } else if (note === PN.note.base || note === "BOTTOM") {
        return PN.note.base;
    }
    return null;
}

PN.getMaterial = function(id) {
    for (let material of PN.database.materials) {
        if (material.id === id) {
            return material;
        }
    }
    return null;
}

PN.getMixture = function(id) {
    for (let mix of PN.database.mixtures) {
        if (mix.id === id) {
            return mix;
        }
    }
    return null;
}

// Immediately load data and validate

fetch('data/materials.json')
    .then(response => response.json())
    .then(data => PN.validateLoadedMaterials(data.materials));

fetch('data/mixtures.json')
    .then(response => response.json())
    .then(data => PN.validateLoadedMixtures(data.mixtures));