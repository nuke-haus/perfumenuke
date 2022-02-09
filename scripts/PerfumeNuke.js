PN = {};
PN.errors = [];
PN.warnings = [];

PN.database = {};
PN.database.mixtures = {};
PN.database.materials = {};
PN.database.formulas = {};

PN.database.currentMaterial = {};
PN.database.currentMixture = {};

PN.database.activeFormula = {};
PN.database.activeFormula.ingredients = [];
PN.database.activeFormula.dilutant = "perfumers_alcohol";
PN.database.activeFormula.dilutant_quantity = 1.0;
PN.database.activeFormula.computed = {};
PN.database.activeFormula.computed.ingredients = {};

PN.note = {};
PN.note.top = "TOP";
PN.note.mid = "HEART";
PN.note.base = "BASE";

PN._jsonOutputLogic = function(key, value) {
    return (value == null || value === "" || value === NaN)
        ? undefined
        : value;
}

PN.getAllDataForExport = function() {
    const exportData = {formulas: [], mixtures: [], materials: []};
    for (let id in PN.database.formulas) {
        const clone = PN.deepCopy(PN.database.formulas[id]);
        clone.computed = null;
        exportData.formulas.push(clone);
    }
    for (let id in PN.database.materials) {
        exportData.materials.push(PN.database.materials[id]);
    }
    for (let id in PN.database.mixtures) {
        exportData.mixtures.push(PN.database.mixtures[id]);
    }
    return JSON.stringify(exportData, PN._jsonOutputLogic, "\t");
}

PN.getFormulasForExport = function() {
    const exportData = {formulas: []};
    for (let id in PN.database.formulas) {
        const clone = PN.deepCopy(PN.database.formulas[id]);
        clone.computed = null;
        exportData.formulas.push(clone);
    }
    return JSON.stringify(exportData, PN._jsonOutputLogic, "\t");
}

PN.getMaterialsForExport = function() {
    const exportData = {materials: []};
    for (let id in PN.database.materials) {
        exportData.materials.push(PN.database.materials[id]);
    }
    return JSON.stringify(exportData, PN._jsonOutputLogic, "\t");
}

PN.getMixturesForExport = function() {
    const exportData = {mixtures: []};
    for (let id in PN.database.mixtures) {
        exportData.mixtures.push(PN.database.mixtures[id]);
    }
    return JSON.stringify(exportData, PN._jsonOutputLogic, "\t");
}

PN.recomputeFormula = function() {
    PN.database.activeFormula.computed = {};
    PN.database.activeFormula.computed.ingredients = {};
    PN.database.activeFormula.computed.ingredients[PN.database.activeFormula.dilutant] = {quantity: PN.database.activeFormula.dilutant_quantity};
    let totalWeight = 0.0;
    let totalNonSolventWeight = 0.0;
    for (let ingredient of PN.database.activeFormula.ingredients) { // ingredient can be material or mixture
        const material = PN.getMaterial(ingredient.id);
        const mixture = PN.getMixture(ingredient.id);
        if (material != null) { // simple case: it's a material
            PN.database.activeFormula.computed.ingredients[material.id] = PN.database.activeFormula.computed.ingredients[material.id] || {};
            const currentQuantity = PN.database.activeFormula.computed.ingredients[material.id].quantity || 0.0;
            PN.database.activeFormula.computed.ingredients[material.id].quantity = currentQuantity + ingredient.quantity;
            totalWeight = totalWeight + ingredient.quantity;
            if (!material.is_solvent) {
                totalNonSolventWeight = totalNonSolventWeight + ingredient.quantity;
            }
        } else if (mixture != null) { // complicated case: it's a mixture so explode it into ingredients
            for (let material of mixture.materials) {
                const innerMixture = PN.getMixture(material.id);
                if (innerMixture != null) { // most complex case: it's a mixture containing nested mixtures
                    for (let innerMaterial of innerMixture.materials) {
                        const illegalMixture = PN.getMixture(innerMaterial.id);
                        if (illegalMixture != null) {
                            alert("A mixture contains too many layers of nested mixtures. This is not supported. Please adjust this mixture in the database: " + ingredient.id);
                            return;
                        }
                        PN.database.activeFormula.computed.ingredients[innerMaterial.id] = PN.database.activeFormula.computed.ingredients[innerMaterial.id] || {};
                        const currentQuantity = PN.database.activeFormula.computed.ingredients[innerMaterial.id].quantity || 0.0;
                        PN.database.activeFormula.computed.ingredients[innerMaterial.id].quantity = currentQuantity + (ingredient.quantity * material.percent * innerMaterial.percent);
                        const foundMaterial = PN.getMaterial(innerMaterial.id);
                        if (!foundMaterial.is_solvent) {
                            totalNonSolventWeight = totalNonSolventWeight + (ingredient.quantity * material.percent * innerMaterial.percent);
                        }
                    }
                } else { // material exploded from the mixture
                    PN.database.activeFormula.computed.ingredients[material.id] = PN.database.activeFormula.computed.ingredients[material.id] || {};
                    const currentQuantity = PN.database.activeFormula.computed.ingredients[material.id].quantity || 0.0;
                    PN.database.activeFormula.computed.ingredients[material.id].quantity = currentQuantity + (ingredient.quantity * material.percent);
                    const foundMaterial = PN.getMaterial(material.id);
                    if (!foundMaterial.is_solvent) {
                        totalNonSolventWeight = totalNonSolventWeight + (ingredient.quantity * material.percent);
                    }
                }
            }
            totalWeight = totalWeight + ingredient.quantity;
        }
    }
    for (let key in PN.database.activeFormula.computed.ingredients) {
        PN.database.activeFormula.computed.ingredients[key].quantity = PN.sanitizeFloat(PN.database.activeFormula.computed.ingredients[key].quantity, 4);
    }
    if (totalWeight > 0.0) {
        for (let key in PN.database.activeFormula.computed.ingredients) { // computed ingredients are all materials
            if (key === PN.database.activeFormula.dilutant) {
                PN.database.activeFormula.computed.ingredients[key].percent = PN.sanitizeFloat(((PN.database.activeFormula.computed.ingredients[key].quantity - PN.database.activeFormula.dilutant_quantity) / totalWeight) * 100.0, 4);
            } else {
                PN.database.activeFormula.computed.ingredients[key].percent = PN.sanitizeFloat((PN.database.activeFormula.computed.ingredients[key].quantity / totalWeight) * 100.0, 4);
            }
            PN.database.activeFormula.computed.ingredients[key].ppt = PN.sanitizeFloat(PN.database.activeFormula.computed.ingredients[key].percent * 10.0, 0);
        }
        for (let key in PN.database.activeFormula.computed.ingredients) {
            PN.database.activeFormula.computed.ingredients[key].percentInProduct = PN.sanitizeFloat((PN.database.activeFormula.computed.ingredients[key].quantity / (totalWeight + PN.database.activeFormula.dilutant_quantity)) * 100.0, 4);
        }
        let concentration = PN.sanitizeFloat((totalWeight / (totalWeight + PN.database.activeFormula.dilutant_quantity)) * 100.0, 4);
        let concentrationNonSolvent = PN.sanitizeFloat((totalNonSolventWeight / (totalWeight + PN.database.activeFormula.dilutant_quantity)) * 100.0, 4);
        if (concentration === Infinity || concentration === NaN) {
            concentration = 100.0;
        }
        if (concentrationNonSolvent === Infinity || concentrationNonSolvent === NaN) {
            concentrationNonSolvent = 100.0;
        }
        PN.database.activeFormula.computed.totalWeight = PN.sanitizeFloat(totalWeight + PN.database.activeFormula.dilutant_quantity, 4);
        PN.database.activeFormula.computed.concentrationWeight = PN.sanitizeFloat(totalWeight, 4);
        PN.database.activeFormula.computed.concentrationNonSolventWeight = PN.sanitizeFloat(totalNonSolventWeight, 4);
        PN.database.activeFormula.computed.concentration = concentration;
        PN.database.activeFormula.computed.concentrationNonSolvent = concentrationNonSolvent;
    }
}


PN.validateFormula = function(formula) { 
    if (formula.id == null) {
        return {error: "Formula is missing an ID!"};
    }
    if (formula.name == null) {
        return {error: "Formula is missing a name: " + formula.id};
    }
    if (formula.ingredients == null || formula.ingredients.length === 0) {
        return {
            warning: "Formula is missing ingredients: " + formula.id,
            formula: formula
        };
    }
    if (formula.dilutant == null) {
        return {
            warning: "Formula is missing a dilutant: " + formula.id,
            formula: formula
        };
    }
    if (formula.dilutant_quantity == null || isNaN(formula.dilutant_quantity)) {
        return {
            warning: "Formula is missing a dilutant quantity: " + formula.id,
            formula: formula
        };
    }
    return {formula: formula};
}

PN.validateLoadedFormulas = function(formulas) {
    for (let formula of formulas) {

        const validationData = PN.validateFormula(formula);

        if (validationData.error) {
            PN.errors.push(validationData.error);
        }
        if (validationData.warning) {
            PN.warnings.push(validationData.warning);
        }
        if (validationData.formula) {
            PN.setFormula(validationData.formula);
        }
    }
}

PN.validateMaterial = function(material) { 
    if (material.id == null) {
        return {error: "Material is missing an ID!"};
    }
    if (material.name == null) {
        return {error: "Material is missing a name: " + material.id};
    }
    if (material.is_solvent === true) { // Solvents are validated differently
        if (material.usage == null) {
            return {
                warning: "Material is missing usage notes:" + material.id,
                material: material
            };
        }
        return {material: material};
    }
    if (material.cas == null) {
        return {error: "Material is missing a CAS number: " + material.id};
    }
    if (material.ifra_restricted === true && (material.max_in_finished_product == null || isNaN(material.max_in_finished_product) || material.max_in_finished_product <= 0.0)) {
        return {error: "Material is IFRA restricted but is missing a max allowance in finished product value: " + material.id};
    }
    material.note = PN.parseNote(material.note);
    if (material.scent == null) {
        return {
            warning: "Material is missing a scent description: " + material.id,
            material: material
        };
    }
    if (material.usage == null && material.is_natural !== true) {
        return {
            warning: "Material is missing usage notes: " + material.id,
            material: material
        };
    }
    if (material.is_natural === true && PN.isBlankString(material.country)) {
        return {
            warning: "Material is flagged as natural but missing its country of origin: " + material.id,
            material: material
        };
    }
    return {material: material};
}

PN.resetErrors = function() {
    PN.errors = [];
    PN.warnings = [];
}

PN.validateLoadedMaterials = function(materials) {
    for (let material of materials) {
        material.ifra_restricted = (String(material.ifra_restricted).toLowerCase().trim() === "true");
        material.is_solvent = (String(material.is_solvent).toLowerCase().trim() === "true");
        material.is_natural = (String(material.is_natural).toLowerCase().trim() === "true");
        material.note = PN.parseNote(material.note);
        if (material.avg_in_concentrate) {
            material.avg_in_concentrate = parseFloat(material.avg_in_concentrate);
        }
        if (material.max_in_concentrate) {
            material.max_in_concentrate = parseFloat(material.max_in_concentrate);
        }
        if (material.max_in_finished_product) {
            material.max_in_finished_product = parseFloat(material.max_in_finished_product);
        }

        const validationData = PN.validateMaterial(material);

        if (validationData.error) {
            PN.errors.push(validationData.error);
        }
        if (validationData.warning) {
            PN.warnings.push(validationData.warning);
        }
        if (validationData.material) {
            PN.setMaterial(validationData.material);
        }
    }
}

PN.validateMixture = function(mixture) {
    if (mixture.id == null) {
        return {error: "Mixture is missing an ID!"};
    }
    if (mixture.name == null) {
        return {error: "Mixture is missing a name: " + mixture.id};
    }
    if (mixture.materials.length < 1) {
        return {error: "Mixture contains no materials: " + mixture.id};
    }
    let totalPercent = 0.0;
    for (let material of mixture.materials) {
        material.percent = PN.parseFloat(material.percent);
        if (isNaN(material.percent)) {
            return {error: "Mixture has invalid material percentage value: " + mixture.id};
        }
        totalPercent = totalPercent + material.percent;
        if (material.id == null || (PN.getMaterial(material.id) == null && PN.getMixture(material.id) == null)) {
            return {error: "Mixture has invalid ID in its material list: " + mixture.id};
        }
        if (material.percent <= 0.0 || material.percent > 1.0) {
            return {error: "Mixture has invalid material percentage value: " + mixture.id};
        }
    }
    totalPercent = PN.sanitizeFloat(totalPercent, 4);
    if (totalPercent !== 1.0) {
        return {error: `Mixture material percentages should add up to 1.0 but total is ${totalPercent}: ` + mixture.id};
    }
    if (mixture.is_natural === true && PN.isBlankString(mixture.country)) {
        return {
            warning: "Mixture is flagged as natural but missing its country of origin: " + mixture.id,
            mixture: mixture
        };
    }
    return {mixture: mixture};
}

PN.sanitizeFloat = function(value, sigFigs) {
    return Math.round(parseFloat((value * Math.pow(10, sigFigs)).toFixed(sigFigs))) / Math.pow(10, sigFigs);
}

PN.validateLoadedMixtures = function(mixtures) {
    for (let mixture of mixtures) {
        mixture.materials = mixture.materials || [];

        const validationData = PN.validateMixture(mixture);

        if (validationData.error) {
            PN.errors.push(validationData.error);
        }
        if (validationData.warning) {
            PN.warnings.push(validationData.warning);
        }
        if (validationData.mixture) {
            PN.setMixture(validationData.mixture);
        }
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

PN.setFormula = function(formula) {
    PN.database.formulas[formula.id] = PN.deepCopy(formula);
}

PN.getFormula = function(id) {
    return PN.database.formulas[id];
}

PN.getMaterial = function(id) {
    return PN.database.materials[id];
}

PN.setMaterial = function(material) {
    PN.database.materials[material.id] = PN.deepCopy(material);
}

PN.getMixture = function(id) {
    return PN.database.mixtures[id];
}

PN.setMixture = function(mixture) {
    PN.database.mixtures[mixture.id] = PN.deepCopy(mixture);
}

PN.getAllSortedMaterialIDs = function() {
    return Object.keys(PN.database.materials).sort();
}

PN.getAllSortedMixtureIDs = function() {
    return Object.keys(PN.database.mixtures).sort();
}

PN.getAllSortedFormulaIDs = function() {
    return Object.keys(PN.database.formulas).sort();
}

PN.getMixtureDilutant = function(mixture) {
    if (mixture.materials == null || mixture.materials.length !== 2) {
        return null;
    }
    for (let material of mixture.materials) {
        const foundMaterial = PN.getMaterial(material.id);
        if (foundMaterial != null && foundMaterial.is_solvent) {
            return material;
        }
    }
    return null;
}

PN.getDilutionPercentString = function(solvent) {
    const material = PN.getMaterial(solvent.id);
    const percent = ((1.0 - solvent.percent) * 100.0).toFixed(1);
    return ` (${percent}% in ${material.name})`;
}

PN.getMaterialsFromMixture = function(mixture) {
    const result = [];
    for (let material of mixture.materials) {
        const foundMaterial = PN.getMaterial(material.id);
        if (foundMaterial) {
            result.push(foundMaterial);
        }
    }
    return result;
}

PN.isBlankString = function(string) {
    return string == null || string.trim() === "";
}

PN.parseFloat = function(value) {
    value = parseFloat(value || "0");
    if (value === NaN || value === Infinity) {
        return 0.0;
    }
    return Math.max(value, 0.0);
}

PN.guid = function() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

PN.deepCopy = function(object) {
    return JSON.parse(JSON.stringify(object));
}

PN.areEqual = function(obj1, obj2) {
    return JSON.stringify(obj1 || "").localeCompare(JSON.stringify(obj2 || "")) === 0;
}