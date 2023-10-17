PN = {};
PN.errors = [];
PN.warnings = [];

PN.database = {};
PN.database.mixtures = {};
PN.database.materials = {};
PN.database.formulas = {};

PN.database.currentMaterial = { ifra_restricted: false };
PN.database.currentMixture = {};

PN.database.activeFormula = {};
PN.database.activeFormula.ingredients = [];
PN.database.activeFormula.dilutant = "perfumers_alcohol";
PN.database.activeFormula.dilutant_quantity = 1.0;
PN.database.activeFormula.computed = {};
PN.database.activeFormula.computed.breakdown = {};
PN.database.activeFormula.computed.manifest = {};

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

PN.deleteLocalStore = function() {
    localStorage.removeItem("perfume_nuke_data");
}

PN.persistInLocalStore = function() {
    localStorage.setItem("perfume_nuke_data", PN.getAllDataForExport());
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

// Recompute the values displayed in the manifest and breakdown sections of the formula page
PN.recomputeFormula = function() {
    PN.database.activeFormula.computed = {};
    PN.database.activeFormula.computed.proportions = {"TOP": 0.0, "HEART": 0.0, "BASE": 0.0};
    PN.database.activeFormula.computed.breakdown = {};
    PN.database.activeFormula.computed.manifest = {};
    PN.database.activeFormula.computed.breakdown[PN.database.activeFormula.dilutant] = {quantity: PN.database.activeFormula.dilutant_quantity};
    PN.database.activeFormula.computed.manifest[PN.database.activeFormula.dilutant] = {quantity: PN.database.activeFormula.dilutant_quantity};
    let totalWeight = 0.0;
    let totalNonSolventWeight = 0.0;
    for (let ingredient of PN.database.activeFormula.ingredients) { // ingredient can be material or mixture
        const material = PN.getMaterial(ingredient.id);
        const mixture = PN.getMixture(ingredient.id);
        if (material != null) { // simple case: it's a material
            // NOTE PROPORTION LOGIC
            if (material.note && material.note != "NONE") {
                PN.database.activeFormula.computed.proportions[material.note] += ingredient.quantity;
            }
            // MANIFEST LOGIC
            PN.database.activeFormula.computed.manifest[material.id] = PN.database.activeFormula.computed.manifest[material.id] || {};
            const currentManifestQuantity = PN.database.activeFormula.computed.manifest[material.id].quantity || 0.0;
            PN.database.activeFormula.computed.manifest[material.id].quantity = currentManifestQuantity + ingredient.quantity;
            // BREAKDOWN LOGIC
            PN.database.activeFormula.computed.breakdown[material.id] = PN.database.activeFormula.computed.breakdown[material.id] || {};
            const currentQuantity = PN.database.activeFormula.computed.breakdown[material.id].quantity || 0.0;
            PN.database.activeFormula.computed.breakdown[material.id].quantity = currentQuantity + ingredient.quantity;
            // GENERAL LOGIC
            totalWeight = totalWeight + ingredient.quantity;
            if (!material.is_solvent) {
                totalNonSolventWeight = totalNonSolventWeight + ingredient.quantity;
            }
        } else if (mixture != null) { // complicated case: it's a mixture so explode it into ingredients for the breakdown
            // MANIFEST LOGIC
            if (mixture.is_dilution) { // break down the dilution into materials
                for (let material of mixture.materials) {
                    const innerMixture = PN.getMixture(material.id);
                    if (innerMixture != null) { // most complex case: it's a mixture containing nested mixtures
                        if (innerMixture.is_dilution) {
                            for (let innerMaterial of innerMixture.materials) {
                                const illegalMixture = PN.getMixture(innerMaterial.id);
                                if (illegalMixture != null) {
                                    alert("A mixture contains too many layers of nested mixtures. This is not supported. Please adjust this mixture in the database: " + ingredient.id);
                                    return;
                                }
                                // NOTE PROPORTION LOGIC
                                const nestedMaterial = PN.getMaterial(innerMaterial.id);
                                if (nestedMaterial.note && nestedMaterial.note != "NONE") {
                                    PN.database.activeFormula.computed.proportions[nestedMaterial.note] += (ingredient.quantity * material.percent * innerMaterial.percent);
                                }
                                // MANIFEST LOGIC
                                PN.database.activeFormula.computed.manifest[innerMaterial.id] = PN.database.activeFormula.computed.manifest[innerMaterial.id] || {};
                                const currentQuantity = PN.database.activeFormula.computed.manifest[innerMaterial.id].quantity || 0.0;
                                PN.database.activeFormula.computed.manifest[innerMaterial.id].quantity = currentQuantity + (ingredient.quantity * material.percent * innerMaterial.percent);
                            }
                        } else { // if it's a diluted mixture, then treat it as a material for the manifest
                            PN.database.activeFormula.computed.manifest[innerMixture.id] = PN.database.activeFormula.computed.manifest[innerMixture.id] || {};
                            const currentQuantity = PN.database.activeFormula.computed.manifest[innerMixture.id].quantity || 0.0;
                            PN.database.activeFormula.computed.manifest[innerMixture.id].quantity = currentQuantity + (ingredient.quantity * material.percent);
                        }
                    } else { // material exploded from the mixture
                        // NOTE PROPORTION LOGIC
                        if (material.note && material.note != "NONE") {
                            PN.database.activeFormula.computed.proportions[material.note] += (ingredient.quantity * material.percent);
                        }
                        // MANIFEST LOGIC
                        PN.database.activeFormula.computed.manifest[material.id] = PN.database.activeFormula.computed.manifest[material.id] || {};
                        const currentQuantity = PN.database.activeFormula.computed.manifest[material.id].quantity || 0.0;
                        PN.database.activeFormula.computed.manifest[material.id].quantity = currentQuantity + (ingredient.quantity * material.percent);
                    }
                }
            } else { // if it's a non-dilution mixture then treat it as a material for the manifest
                // NOTE PROPORTION LOGIC
                if (mixture.note && mixture.note != "NONE") {
                    PN.database.activeFormula.computed.proportions[mixture.note] += ingredient.quantity;
                }
                // MANIFEST LOGIC
                PN.database.activeFormula.computed.manifest[mixture.id] = PN.database.activeFormula.computed.manifest[mixture.id] || {};
                const currentManifestQuantity = PN.database.activeFormula.computed.manifest[mixture.id].quantity || 0.0;
                PN.database.activeFormula.computed.manifest[mixture.id].quantity = currentManifestQuantity + ingredient.quantity;
            }
            // BREAKDOWN LOGIC
            for (let material of mixture.materials) {
                const innerMixture = PN.getMixture(material.id);
                if (innerMixture != null) { // most complex case: it's a mixture containing nested mixtures
                    for (let innerMaterial of innerMixture.materials) {
                        const illegalMixture = PN.getMixture(innerMaterial.id);
                        if (illegalMixture != null) {
                            alert("A mixture contains too many layers of nested mixtures. This is not supported. Please adjust this mixture in the database: " + ingredient.id);
                            return;
                        }
                        PN.database.activeFormula.computed.breakdown[innerMaterial.id] = PN.database.activeFormula.computed.breakdown[innerMaterial.id] || {};
                        const currentQuantity = PN.database.activeFormula.computed.breakdown[innerMaterial.id].quantity || 0.0;
                        PN.database.activeFormula.computed.breakdown[innerMaterial.id].quantity = currentQuantity + (ingredient.quantity * material.percent * innerMaterial.percent);
                        const foundMaterial = PN.getMaterial(innerMaterial.id);
                        if (!foundMaterial.is_solvent) {
                            totalNonSolventWeight = totalNonSolventWeight + (ingredient.quantity * material.percent * innerMaterial.percent);
                        }
                    }
                } else { // material exploded from the mixture
                    PN.database.activeFormula.computed.breakdown[material.id] = PN.database.activeFormula.computed.breakdown[material.id] || {};
                    const currentQuantity = PN.database.activeFormula.computed.breakdown[material.id].quantity || 0.0;
                    PN.database.activeFormula.computed.breakdown[material.id].quantity = currentQuantity + (ingredient.quantity * material.percent);
                    const foundMaterial = PN.getMaterial(material.id);
                    if (!foundMaterial.is_solvent) {
                        totalNonSolventWeight = totalNonSolventWeight + (ingredient.quantity * material.percent);
                    }
                }
            }
            // GENERAL LOGIC
            totalWeight = totalWeight + ingredient.quantity;
        }
    }
    // sanitize floats
    for (let key in PN.database.activeFormula.computed.breakdown) {
        PN.database.activeFormula.computed.breakdown[key].quantity = PN.sanitizeFloat(PN.database.activeFormula.computed.breakdown[key].quantity, 4);
    }
    for (let key in PN.database.activeFormula.computed.manifest) {
        PN.database.activeFormula.computed.manifest[key].quantity = PN.sanitizeFloat(PN.database.activeFormula.computed.manifest[key].quantity, 4);
    }
    if (totalWeight > 0.0) {
        for (let key in PN.database.activeFormula.computed.breakdown) { // computed breakdown ingredients are all materials
            const material = PN.getMaterial(key);
            if (material.is_solvent) {
                PN.database.activeFormula.computed.breakdown[key].percent = 0;
                PN.database.activeFormula.computed.breakdown[key].ppt = 0;
            } else {
                PN.database.activeFormula.computed.breakdown[key].percent = PN.sanitizeFloat((PN.database.activeFormula.computed.breakdown[key].quantity / totalNonSolventWeight) * 100.0, 4);
                PN.database.activeFormula.computed.breakdown[key].ppt = PN.sanitizeFloat(PN.database.activeFormula.computed.breakdown[key].percent * 10.0, 0);
            }
        }
        for (let key in PN.database.activeFormula.computed.manifest) { // computed manifest ingredients are materials and mixtures
            const material = PN.getMaterial(key);
            const mixture = PN.getMixture(key);
            if (material != null) {
                if (material.is_solvent) {
                    PN.database.activeFormula.computed.manifest[key].percent = 0;
                    PN.database.activeFormula.computed.manifest[key].ppt = 0;
                } else {
                    PN.database.activeFormula.computed.manifest[key].percent = PN.sanitizeFloat((PN.database.activeFormula.computed.manifest[key].quantity / totalNonSolventWeight) * 100.0, 4);
                    PN.database.activeFormula.computed.manifest[key].ppt = PN.sanitizeFloat(PN.database.activeFormula.computed.manifest[key].percent * 10.0, 0);
                }
            } else {
                PN.database.activeFormula.computed.manifest[key].percent = PN.sanitizeFloat((PN.database.activeFormula.computed.manifest[key].quantity / totalNonSolventWeight) * 100.0, 4);
                PN.database.activeFormula.computed.manifest[key].ppt = PN.sanitizeFloat(PN.database.activeFormula.computed.manifest[key].percent * 10.0, 0);
            }
        }
        // sanitize floats
        for (let key in PN.database.activeFormula.computed.breakdown) {
            PN.database.activeFormula.computed.breakdown[key].percentInProduct = PN.sanitizeFloat((PN.database.activeFormula.computed.breakdown[key].quantity / (totalWeight + PN.database.activeFormula.dilutant_quantity)) * 100.0, 4);
        }
        for (let key in PN.database.activeFormula.computed.manifest) {
            PN.database.activeFormula.computed.manifest[key].percentInProduct = PN.sanitizeFloat((PN.database.activeFormula.computed.manifest[key].quantity / (totalWeight + PN.database.activeFormula.dilutant_quantity)) * 100.0, 4);
        }
        // calculate proportions
        const totalProportion = PN.database.activeFormula.computed.proportions["TOP"] + PN.database.activeFormula.computed.proportions["HEART"] + PN.database.activeFormula.computed.proportions["BASE"];
        PN.database.activeFormula.computed.proportions["TOP"] = PN.sanitizeFloat((PN.database.activeFormula.computed.proportions["TOP"] / totalProportion) * 100.0, 2);
        PN.database.activeFormula.computed.proportions["HEART"] = PN.sanitizeFloat((PN.database.activeFormula.computed.proportions["HEART"] / totalProportion) * 100.0, 2);
        PN.database.activeFormula.computed.proportions["BASE"] = PN.sanitizeFloat((PN.database.activeFormula.computed.proportions["BASE"] / totalProportion) * 100.0, 2);
        // compute the general info
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
        material.tags = material.tags || [];
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
    if (mixture.materials == null || mixture.materials.length < 1) {
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
        mixture.tags = mixture.tags || [];

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

PN.getAllUniqueTags = function() {
    const tags = [];
    for (let material of Object.values(PN.database.materials)) {
        for (let tag of material.tags || []) {
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        }
    }
    for (let mixture of Object.values(PN.database.mixtures)) {
        for (let tag of mixture.tags || []) {
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        }
    }
    tags.sort();
    return tags;
}

PN.getMaterialsAndMixturesWithTags = function(tags, isAbsolute) {
    if (tags.length === 0) {
        return [];
    }
    function dynamicSort(property) {
        return function (a,b) {
            const result = (a[property] < b[property]) 
                ? -1 
                : (a[property] > b[property]) 
                    ? 1 
                    : 0;
            return result;
        }
    }
    const materials = [];
    for (let material of Object.values(PN.database.materials)) {
        if (materials.filter(curMat => curMat.id === material.id).length > 0) {
            continue;
        }
        const materialTags = material.tags || [];
        let count = 0;
        for (let tag of tags) {
            if (materialTags.includes(tag)){
                if (isAbsolute) {
                    count++;
                } else {
                    materials.push(material);
                    break;
                }
            }
        }
        if (isAbsolute && count === tags.length) {
            materials.push(material);
        }
    }

    const mixtures = [];
    for (let mix of Object.values(PN.database.mixtures)) {
        if (PN.isMixtureDilution(mix) || mixtures.filter(curMix => curMix.id === mix.id).length > 0) {
            continue;
        }
        const mixTags = mix.tags || [];
        let count = 0;
        for (let tag of tags) {
            if (mixTags.includes(tag)){
                if (isAbsolute) {
                    count++;
                } else {
                    mixtures.push(mix);
                    break;
                }
            }
        }
        if (isAbsolute && count === tags.length) {
            mixtures.push(mix);
        }
    }

    return materials.concat(mixtures).sort(dynamicSort('name'));
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

PN.isMixtureDilution = function(mixture) {
    return mixture.is_dilution === true;
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