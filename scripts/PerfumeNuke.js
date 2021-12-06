PN = {};
PN.activeFormula = {};
PN.activeFormula.ingredients = [];
PN.activeFormula.computed = {};
PN.errors = [];
PN.warnings = [];

PN.database = {};
PN.database.mixtures = [];
PN.database.materials = [];

PN.note = {};
PN.note.top = "TOP";
PN.note.mid = "HEART";
PN.note.base = "BASE";

PN.recomputeFormula = function() {
    PN.activeFormula.computed = {};
    let totalWeight = 0.0;
    for (let ingredient of PN.activeFormula.ingredients) { // ingredient can be material or mixture
        const material = PN.getMaterial(ingredient.id);
        const mixture = PN.getMixture(ingredient.id);
        if (material != null) {
            PN.activeFormula.computed[material.id] = PN.activeFormula.computed[material.id] || {};
            const currentQuantity = PN.activeFormula.computed[material.id].quantity || 0.0;
            PN.activeFormula.computed[material.id].quantity = currentQuantity + ingredient.quantity;
            totalWeight = totalWeight + ingredient.quantity;
        } else if (mixture != null) {
            for (let material of mixture.materials) {
                PN.activeFormula.computed[material.id] = PN.activeFormula.computed[material.id] || {};
                const currentQuantity = PN.activeFormula.computed[material.id].quantity || 0.0;
                PN.activeFormula.computed[material.id].quantity = currentQuantity + (ingredient.quantity * material.percent);
                totalWeight = totalWeight + (ingredient.quantity * material.percent);
            }
        }
    }
    if (totalWeight > 0.0) {
        for (let key in PN.activeFormula.computed) {
            PN.activeFormula.computed[key].percent = (PN.activeFormula.computed[key].quantity / totalWeight) * 100.0;
        }
    }
}

PN.getDilutionMaterialPercent = function(mixture) {
    if (mixture.diluted_material == null) {
        return 0;
    }
    for (let material of mixture.materials) {
        if (material.id === mixture.diluted_material) {
            return material.percent;
        }
    }
    return 0;
}

PN.getDilutionPercentString = function(mixture) {
    const percent = PN.getDilutionMaterialPercent(mixture);
    return ` (${percent * 100.0}%)`;
}

PN.validateLoadedMaterials = function(materials) {
    PN.database.materials = [];

    for (let material of materials) {
        material.ifra_restricted = ((material.ifra_restricted || "").toLowerCase().trim() === "true");
        material.solvent = ((material.solvent || "").toLowerCase().trim() === "true");
        material.note = PN.parseNote(material.note);
    
        if (PN.getMaterial(material.id) != null) {
            PN.errors.push("ID has been defined more than once in data: " + material.id);
            continue;
        }
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
            PN.errors.push("Material is IFRA restricted but is missing a max allowance in finished product value: " + material.id);
            continue;
        }
        if (material.note !== PN.note.top && material.note !== PN.note.mid && material.note !== PN.note.base) {
            PN.errors.push("Material note type is invalid: " + material.id);
            continue;
        }
        if (material.scent == null) {
            PN.warnings.push("Material is missing a scent description: " + material.id);
        }
        if (material.usage == null) {
            PN.warnings.push("Material is missing usage notes: " + material.id);
        }
    
        PN.database.materials.push(material);
    }
}

PN.validateLoadedMixtures = function(mixtures) {
    PN.database.mixtures = [];

    for (let mixture of mixtures) {
        mixture.materials = mixture.materials || [];
        if (PN.getMaterial(mixture.id) != null || PN.getMixture(mixture.id != null)) {
            PN.errors.push("ID has been defined more than once in data: " + mixture.id);
            continue;
        }
        if (mixture.id == null) {
            PN.errors.push("Mixture is missing an ID!");
            continue;
        }
        if (mixture.name == null) {
            PN.errors.push("Mixture is missing a name: " + mixture.id);
            continue;
        }
        if (mixture.materials.length < 2) {
            PN.errors.push("Mixture contains less than 2 materials: " + mixture.id);
            continue;
        }
        let materialsValid = true;
        let totalPercent = 0.0;
        for (let material of mixture.materials) {
            material.percent = parseFloat(material.percent || "10.0");
            totalPercent = totalPercent + material.percent;
            if (material.id == null || PN.getMaterial(material.id) == null) {
                PN.errors.push("Mixture has invalid material ID in its material list: " + mixture.id);
                materialsValid = false;
                break; 
            }
            if (material.percent < 0.0 || material.percent >= 1.0) {
                PN.errors.push("Mixture has invalid material percentage value: " + mixture.id);
                materialsValid = false;
                break; 
            }
        }
        if (!materialsValid) {
            continue;
        }
        if (totalPercent !== 1.0) {
            PN.errors.push("Mixture material percentages don't add up to 1.0: " + mixture.id);
            continue;
        }
        if (mixture.diluted_material != null) {
            const foundMaterial = PN.getMaterial(mixture.diluted_material);
            if (foundMaterial == null) {
                PN.errors.push("Mixture dilution material ID is invalid: " + mixture.id);
                continue;
            } 
            let hasDilutedMaterial = false;
            for (let material of mixture.materials) {
                if (material.id === mixture.diluted_material) {
                    hasDilutedMaterial = true;
                    break;
                }
            }
            if (!hasDilutedMaterial) {
                PN.errors.push("Mixture dilution material is not present in its material list: " + mixture.id);
                continue;
            }
        }
        if (mixture.scent == null && mixture.diluted_material == null) {
            PN.warnings.push("Mixture is missing a scent description: " + mixture.id);
        }
        if (mixture.usage == null && mixture.diluted_material == null) {
            PN.warnings.push("Mixture is missing usage notes: " + mixture.id);
        }
        
        PN.database.mixtures.push(mixture);
    }
}

PN.parseNote = function(note) {
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

PN.guid = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }