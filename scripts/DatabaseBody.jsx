class DatabaseBody extends React.Component {

    state = {
        materialKey: "mat",
        materialButtonKey: "matButton",
        mixtureKey: "mix",
        mixtureButtonKey: "mixButton",
        currentTag: "",
        currentMixtureTag: ""
    };

    _selectedMaterialID = "";
    _selectedMixtureID = "";
    _selectedDilutantID = "";
    _selectedMixtureDilutantID = "";
    _dilutionAmount = 10;
    _mixtureDilutionAmount = 10;

    _formatName(value) {
        const str = String(value);
        return (str.charAt(0).toUpperCase() + str.slice(1));
    }

    _formatLower(value) {
        return String(value).toLowerCase();
    }

    _formatUpper(value) {
        return String(value).toUpperCase();
    }

    // MATERIAL LOGIC
    // --------------------------------------------------------------------------------------

    _onChangeMaterial(key, value) {
        if (key === "ifra_restricted") { 
            PN.database.currentMaterial.max_in_finished_product = (value === false)
                ? null
                : 0.1;
            this.setState({materialKey: PN.guid()});
        }
        if (key === "is_natural" && value === false) {
            PN.database.currentMaterial["country"] = null;
            this.setState({materialKey: PN.guid()});
        }
        if ((key === "avg_in_concentrate" || key === "max_in_concentrate") && value === 0) {
            value = null;
        }
        if (key === "note" && value === " ") {
            value = null;
        }
        PN.database.currentMaterial[key] = value;
        this.setState({materialButtonKey: PN.guid()});
    }

    _createOrUpdateMaterial() {
        if (!this._hasValidMaterialID()) {
            return;
        }
        const validationData = PN.validateMaterial(PN.database.currentMaterial);
        if (validationData.error) {
            alert(validationData.error);
            return;
        }
        if (validationData.material) {
            PN.setMaterial(validationData.material);
            PN.persistInLocalStore();
            this.setState({materialButtonKey: PN.guid()});
        }
    }

    _hasValidMaterialID() {
        return !!PN.database.currentMaterial.id;
    }

    _currentMaterialIsDirty() {
        const material = PN.getMaterial(PN.database.currentMaterial.id || "");
        return !PN.areEqual(material, PN.database.currentMaterial);
    }

    _disableMaterialButton() {
        if (!this._hasValidMaterialID()) {
            return true;
        }
        return !this._currentMaterialIsDirty();
    }

    _changeSelectedMaterial(id) {
        this._selectedMaterialID = id;
    }

    _changeDilutantMaterial(id) {
        this._selectedDilutantID = id;
    }

    _onChangeDilution(percent) {
        this._dilutionAmount = percent;
    }

    _tryCreateDilution() {
        const currentMaterial = PN.getMaterial(PN.database.currentMaterial.id || "");
        const currentDilutant = PN.getMaterial(this._selectedDilutantID || "");
        if (currentMaterial == null) {
            alert("Unable to create a dilution for a material that does not exist in the database.");
            return;
        }
        if (currentDilutant == null) {
            alert("Unable to create a dilution with a dilutant that does not exist in the database.");
            return;
        }
        if (this._dilutionAmount <= 0.0 || this._dilutionAmount >= 100.0) {
            alert("Unable to create a dilution with an invalid percentage.");
            return;
        }
        const mixtureId = `${currentMaterial.id}_${this._dilutionAmount}_${currentDilutant.id}`;
        const existingMixture = PN.getMixture(mixtureId);
        if (existingMixture != null) {
            alert("A dilution already exists for this material.");
            return;
        }
        const mixture = {
            id: mixtureId,
            name: currentMaterial.name,
            scent: currentMaterial.scent,
            tags: currentMaterial.tags,
            is_dilution: true,
            usage: `${this._dilutionAmount}% dilution of ${currentMaterial.name} in ${currentDilutant.name}`,
            materials: [
                {
                    id: currentMaterial.id,
                    percent: PN.sanitizeFloat(this._dilutionAmount * 0.01, 4)
                },
                {
                    id: currentDilutant.id,
                    percent: PN.sanitizeFloat((100.0 - this._dilutionAmount) * 0.01, 4)
                },
            ]
        }
        PN.setMixture(mixture);
        this.setState({mixtureKey: PN.guid()});
        alert("Created dilution successfully.");
    }

    _tryCreateMaterialTag() {
        const tags = PN.database.currentMaterial.tags || [];
        if (!tags.includes(this.state.currentTag)) {
            tags.push(this.state.currentTag.toUpperCase().trim());
            PN.database.currentMaterial.tags = tags;
            this.forceUpdate();
        }
    }

    _deleteMaterialTag(tag) {
        PN.database.currentMaterial.tags = PN.database.currentMaterial.tags.filter(curTag => curTag.toUpperCase() !== tag.toUpperCase());
        this.forceUpdate();
    }

    _loadMaterial() {
        const material = PN.getMaterial(this._selectedMaterialID);
        if (material != null) {
            PN.database.currentMaterial = PN.deepCopy(material);
            this.setState({materialKey: PN.guid()});
        }
    }

    _addCost() {
        PN.database.currentMaterial.costs = PN.database.currentMaterial.costs || [];
        const newCost = {
            name: "",
            cost: ""
        };
        PN.database.currentMaterial.costs.push(newCost);
        this.setState({materialKey: PN.guid()});
    }

    _changeCost(index, key, value) {
        PN.database.currentMaterial.costs[index][key] = value;
        this.setState({materialButtonKey: PN.guid()});
    }

    _deleteCost(index) {
        PN.database.currentMaterial.costs.splice(index, 1);
        this.setState({materialKey: PN.guid()});
    }

    // MIXTURE LOGIC
    // --------------------------------------------------------------------------------------

    _changeMixtureDilutantMaterial(id) {
        this._selectedMixtureDilutantID = id;
    }

    _onChangeMixtureDilution(percent) {
        this._mixtureDilutionAmount = percent;
    }

    _tryCreateMixtureDilution() {
        const currentMixture = PN.getMixture(PN.database.currentMixture.id || "");
        const currentDilutant = PN.getMaterial(this._selectedMixtureDilutantID || "");
        if (currentMixture == null) {
            alert("Unable to create a dilution for a mixture that does not exist in the database.");
            return;
        }
        if (currentDilutant == null) {
            alert("Unable to create a dilution with a dilutant that does not exist in the database.");
            return;
        }
        if (this._mixtureDilutionAmount <= 0.0 || this._mixtureDilutionAmount >= 100.0) {
            alert("Unable to create a dilution with an invalid percentage.");
            return;
        }
        const mixtureId = `${currentMixture.id}_${this._mixtureDilutionAmount}_${currentDilutant.id}`;
        const existingMixture = PN.getMixture(mixtureId);
        if (existingMixture != null) {
            alert("A dilution already exists for this mixture.");
            return;
        }
        const mixture = {
            id: mixtureId,
            name: currentMixture.name,
            scent: currentMixture.scent,
            is_natural: false,
            is_dilution: true,
            country: currentMixture.country,
            usage: `${this._mixtureDilutionAmount}% dilution of ${currentMixture.name} in ${currentDilutant.name}`,
            materials: [
                {
                    id: currentMixture.id,
                    percent: PN.sanitizeFloat(this._mixtureDilutionAmount * 0.01, 4)
                },
                {
                    id: currentDilutant.id,
                    percent: PN.sanitizeFloat((100.0 - this._mixtureDilutionAmount) * 0.01, 4)
                },
            ]
        }
        PN.setMixture(mixture);
        this.setState({mixtureKey: PN.guid()});
        alert("Created dilution successfully.");
    }

    _tryCreateMixtureTag() {
        const tags = PN.database.currentMixture.tags || [];
        if (!tags.includes(this.state.currentMixtureTag)) {
            tags.push(this.state.currentMixtureTag.toUpperCase().trim());
            PN.database.currentMixture.tags = tags;
            this.forceUpdate();
        }
    }

    _deleteMixtureTag(tag) {
        PN.database.currentMixture.tags = PN.database.currentMixture.tags.filter(curTag => curTag.toUpperCase() !== tag.toUpperCase());
        this.forceUpdate();
    }


    _onChangeMixture(key, value) {
        if (key === "is_natural" && value === false) {
            PN.database.currentMixture.country = null;
            this.setState({mixtureKey: PN.guid()});
        }
        if ((key === "avg_in_concentrate" || key === "max_in_concentrate") && value === 0) {
            value = null;
        }

        PN.database.currentMixture[key] = value;
        this.setState({mixtureButtonKey: PN.guid()});
    }

    _createOrUpdateMixture() {
        if (!this._hasValidMixtureID()) {
            return;
        }
        const validationData = PN.validateMixture(PN.database.currentMixture);
        if (validationData.error) {
            alert(validationData.error);
            return;
        }
        if (validationData.mixture) {
            PN.setMixture(validationData.mixture);
            PN.persistInLocalStore()
            this.setState({mixtureButtonKey: PN.guid()});
        }
    }

    _hasValidMixtureID() {
        return !!PN.database.currentMixture.id;
    }

    _currentMixtureIsDirty() {
        const mix = PN.getMixture(PN.database.currentMixture.id || "");
        return !PN.areEqual(mix, PN.database.currentMixture);
    }

    _disableMixtureButton() {
        if (!this._hasValidMixtureID()) {
            return true;
        }
        return !this._currentMixtureIsDirty();
    }

    _changeSelectedMixture(id) {
        this._selectedMixtureID = id;
    }

    _loadMixture() {
        const mix = PN.getMixture(this._selectedMixtureID);
        if (mix != null) {
            PN.database.currentMixture = PN.deepCopy(mix);
            this.setState({mixtureKey: PN.guid()});
        }
    }

    _addMaterialToMixture() {
        PN.database.currentMixture.materials = PN.database.currentMixture.materials || [];
        const newMaterial = {
            id: "",
            percent: 0.0
        };
        PN.database.currentMixture.materials.push(newMaterial);
        this.setState({mixtureKey: PN.guid()});
    }

    _changeMixtureMaterial(index, key, value) {
        PN.database.currentMixture.materials[index][key] = value;  
        this.setState({mixtureButtonKey: PN.guid()});
    }

    _deleteMaterialFromMixture(index) {
        PN.database.currentMixture.materials.splice(index, 1);
        this.setState({mixtureKey: PN.guid()});
    }

    // IMPORT / EXPORT / DATA MANAGEMENT LOGIC
    // --------------------------------------------------------------------------------------

    _onImportFormulaFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => this._onImportFormulasSuccess(JSON.parse(event.target.result));
        fileReader.readAsText(file);
    }

    _onImportFormulasSuccess(data) {
        PN.resetErrors();
        PN.validateLoadedFormulas(data.formulas);
        if (PN.errors.length > 0) {
            alert("Some of the imported formulas could not be validated. Check the errors tab for more details.");
        } else if (PN.warnings.length > 0) {
            alert("Some of the imported formulas generated warnings. Check the errors tab for more details.");
        } else {
            alert(`Imported ${data.formulas.length} formulas.`);
        }
        PN.persistInLocalStore();
    }

    _exportFormulas() {
        const data = PN.getFormulasForExport();
        this._downloadLink.setAttribute('href', 'data:application/JSON;charset=utf-8,' + encodeURIComponent(data));
        this._downloadLink.setAttribute('download', "formulas.json");
        this._downloadLink.click();
    }

    _onImportMaterialFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => this._onImportMaterialsSuccess(JSON.parse(event.target.result));
        fileReader.readAsText(file);
    }

    _onImportMaterialsSuccess(data) {
        PN.resetErrors();
        PN.validateLoadedMaterials(data.materials);
        if (PN.errors.length > 0) {
            alert("Some of the imported materials could not be validated. Check the errors tab for more details.");
        } else if (PN.warnings.length > 0) {
            alert("Some of the imported materials generated warnings. Check the errors tab for more details.");
        } else {
            alert(`Imported ${data.materials.length} materials.`);
        }
        this.setState({
            materialKey: PN.guid(), 
            mixtureKey: PN.guid()
        });
        PN.persistInLocalStore();
    }

    _onImportMixtureFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => this._onImportMixturesSuccess(JSON.parse(event.target.result));
        fileReader.readAsText(file);
    }

    _onImportMixturesSuccess(data) {
        PN.resetErrors();
        PN.validateLoadedMixtures(data.mixtures);
        if (PN.errors.length > 0) {
            alert("Some of the imported mixtures could not be validated. Check the errors tab for more details.");
        } else if (PN.warnings.length > 0) {
            alert("Some of the imported mixtures generated warnings. Check the errors tab for more details.");
        } else {
            alert(`Imported ${data.mixtures.length} mixtures.`);
        }
        this.setState({
            materialKey: PN.guid(), 
            mixtureKey: PN.guid()
        });
        PN.persistInLocalStore();
    }

    _onImportAllFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = (event) => this._onImportAllSuccess(JSON.parse(event.target.result));
        fileReader.readAsText(file);
    }

    _onImportAllSuccess(data) {
        PN.resetErrors();
        PN.validateLoadedMaterials(data.materials);
        PN.validateLoadedMixtures(data.mixtures);
        PN.validateLoadedFormulas(data.formulas);
        if (PN.errors.length > 0) {
            alert("Some of the imported data could not be validated. Check the errors tab for more details.");
        } else if (PN.warnings.length > 0) {
            alert("Some of the imported data generated warnings. Check the errors tab for more details.");
        } else {
            alert(`Imported ${data.materials.length} materials, ${data.mixtures.length} mixtures, and ${data.formulas.length} formulas.`);
        }
        this.setState({
            materialKey: PN.guid(), 
            mixtureKey: PN.guid()
        });
        PN.persistInLocalStore();
    }

    _exportMaterials() {
        const data = PN.getMaterialsForExport();
        this._downloadLink.setAttribute('href', 'data:application/JSON;charset=utf-8,' + encodeURIComponent(data));
        this._downloadLink.setAttribute('download', "materials.json");
        this._downloadLink.click();
    }

    _exportMixtures() {
        const data = PN.getMixturesForExport();
        this._downloadLink.setAttribute('href', 'data:application/JSON;charset=utf-8,' + encodeURIComponent(data));
        this._downloadLink.setAttribute('download', "mixtures.json");
        this._downloadLink.click();
    }

    _exportAll() {
        const data = PN.getAllDataForExport();
        this._downloadLink.setAttribute('href', 'data:application/JSON;charset=utf-8,' + encodeURIComponent(data));
        this._downloadLink.setAttribute('download', "perfumenuke.json");
        this._downloadLink.click();
    }

    _deleteCachedData() {
        PN.deleteLocalStore();
        alert("Locally stored data has been wiped. You can refresh the page to reload the default data.");
    }

    // RENDER
    // --------------------------------------------------------------------------------------

    _renderMixtureRows() {
        const elements = [];
        for (let index in PN.database.currentMixture.materials || []) {
            const matData = PN.database.currentMixture.materials[index];
            const label = `INGREDIENT ${parseInt(index) + 1}:`
            elements.push(
                <tr key={"mixturematerial" + index}>
                    <td colSpan="2">
                        {label}
                        <IngredientPicker defaultValue={matData.id}
                                          id={"mixturematerial" + index}
                                          allowSolvents={true}
                                          allowMixtures={true}
                                          onChange={(id) => this._changeMixtureMaterial(index, "id", id)}/>
                    </td>
                    <td>
                        <div>
                            % IN MIXTURE: 
                        </div>
                        <div>
                            <input type="number" 
                                   step="0.001" 
                                   min="0"
                                   max="100"
                                   defaultValue={PN.sanitizeFloat(PN.parseFloat(matData.percent) * 100.0, 3)}
                                   onChange={(event) =>  this._changeMixtureMaterial(index, "percent", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                        </div>
                    </td>  
                    <td>
                        <button type="button" 
                                onClick={() => this._deleteMaterialFromMixture(index)}>
                            Delete
                        </button>
                    </td>
                </tr>
            );
        }
        elements.push(
            <tr key="mixturematerialbutton">
                <td colSpan="4">
                    <button type="button" 
                            onClick={() => this._addMaterialToMixture()}>
                        Add Ingredient To Mixture
                    </button>
                </td>
            </tr>
        );
        return elements;
    }

    _renderMaterialCostRows() {
        return null; // commenting out since this functionality isn't really important currently
        const elements = [];
        for (let index in PN.database.currentMaterial.costs || []) {
            const costData = PN.database.currentMaterial.costs[index];
            elements.push(
                <tr key={"cost" + index}>
                    <td>
                        SUPPLIER:
                        <input defaultValue={costData.name}
                               className="databaseinput" 
                               onChange={(event) =>  this._changeCost(index, "name", event.target.value)}/>
                    </td>
                    <td>
                        COST:
                        <input defaultValue={costData.cost}
                               className="databaseinput" 
                               onChange={(event) =>  this._changeCost(index, "cost", event.target.value)}/>
                    </td>
                    <td>
                        <button type="button" 
                                onClick={() => this._deleteCost(index)}>
                            Delete
                        </button>
                    </td>
                </tr>
            );
        }
        elements.push(
            <tr key="mixturematerialbutton">
                <td colSpan="3">
                    <button type="button" 
                            onClick={() => this._addCost()}>
                        Add Cost To Material
                    </button>
                </td>
            </tr>
        );
        return elements;
    }

    render() {
        const matExistsInDatabase = PN.getMaterial(PN.database.currentMaterial.id || "") != null;
        const matButtonLabel = matExistsInDatabase
            ? "Save Current Material"
            : "Create New Material";
        const mixExistsInDatabase = PN.getMixture(PN.database.currentMixture.id || "") != null;
        const mixButtonLabel = mixExistsInDatabase
            ? "Save Current Mixture"
            : "Create New Mixture";
        const materialTags = [];
        for (let tag of PN.database.currentMaterial.tags || []) {
            materialTags.push(
                <div className="tag tagedit" key={"materialTag" + tag}>
                    <span>{tag} </span>
                    <span className="clickabletag" onClick={() => this._deleteMaterialTag(tag)}>❌</span>
                </div>
            );
        }
        const mixtureTags = [];
        for (let tag of PN.database.currentMixture.tags || []) {
            mixtureTags.push(
                <div className="tag tagedit" key={"mixtureTag" + tag}>
                    <span>{tag} </span>
                    <span className="clickabletag" onClick={() => this._deleteMixtureTag(tag)}>❌</span>
                </div>
            );
        }
        return (
            <div>
                <a ref={(ref) => this._downloadLink = ref}/>
                <div className="tabletext">
                    MANAGE DATA
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <td>
                                <div>
                                    IMPORT ALL DATA: 
                                </div>
                                <div>
                                    <input type="file"
                                           accept="application/JSON"
                                           onChange={(event) => this._onImportAllFile(event.target.files[0])}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    IMPORT MATERIALS: 
                                </div>
                                <div>
                                    <input type="file"
                                           accept="application/JSON"
                                           onChange={(event) => this._onImportMaterialFile(event.target.files[0])}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    IMPORT MIXTURES:
                                </div>
                                <div>
                                    <input type="file"
                                           accept="application/JSON"
                                           onChange={(event) => this._onImportMixtureFile(event.target.files[0])}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    IMPORT FORMULAS: 
                                </div>
                                <div>
                                    <input type="file"
                                           accept="application/JSON"
                                           onChange={(event) => this._onImportFormulaFile(event.target.files[0])}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <button type="button" 
                                        onClick={() => this._exportAll()}>
                                    Export All Data
                                </button>
                            </td>
                            <td>
                                <button type="button" 
                                        onClick={() => this._exportMaterials()}>
                                    Export All Materials
                                </button>
                            </td>
                            <td>
                                <button type="button" 
                                        onClick={() => this._exportMixtures()}>
                                    Export All Mixtures
                                </button>
                            </td>
                            <td>
                                <button type="button" 
                                        onClick={() => this._exportFormulas()}>
                                    Export All Formulas
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="4">
                                <button type="button" 
                                        onClick={() => this._deleteCachedData()}>
                                    ☢️ Delete All Locally Cached Data ☢️
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    MATERIAL EDITOR
                </div>
                <table className="ingredienttable" key={this.state.materialKey}>
                    <tbody>
                        <tr>
                            <td>
                                ID: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.id}
                                       onChange={(event) => this._onChangeMaterial("id", this._formatLower(event.target.value))}/>
                            </td>
                            <td>
                                NAME: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.name}
                                       onChange={(event) => this._onChangeMaterial("name", this._formatName(event.target.value))}/>
                            </td>
                            <td>
                                COMPANY NAME: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.company}
                                       onChange={(event) => this._onChangeMaterial("company", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    IS SOLVENT? 
                                </div>
                                <div>
                                    <select defaultValue={String(PN.database.currentMaterial.is_solvent)}
                                                onChange={(event) => this._onChangeMaterial("is_solvent", event.target.value === "true")}>
                                        <option value="false">FALSE</option>
                                        <option value="true">TRUE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <div>
                                    IS NATURAL?
                                </div>
                                <div>
                                    <select defaultValue={String(PN.database.currentMaterial.is_natural)}
                                                onChange={(event) => this._onChangeMaterial("is_natural", event.target.value === "true")}>
                                        <option value="false">FALSE</option>
                                        <option value="true">TRUE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                COUNTRY OF ORIGIN: 
                                <input className="databaseinput" 
                                       disabled={PN.database.currentMaterial.is_natural !== true}
                                       defaultValue={PN.database.currentMaterial.is_natural ? PN.database.currentMaterial.country : ""}
                                       onChange={(event) => this._onChangeMaterial("country", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                SCENT: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.scent}
                                       onChange={(event) => this._onChangeMaterial("scent", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                USAGE: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.usage}
                                       onChange={(event) => this._onChangeMaterial("usage", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    NOTE: 
                                </div>
                                <div>
                                    <select value={PN.database.currentMaterial.note || " "} 
                                            onChange={(event) => this._onChangeMaterial("note", event.target.value)}>
                                        <option value=" ">NONE</option>
                                        <option value="TOP">TOP</option>
                                        <option value="HEART">HEART</option>
                                        <option value="BASE">BASE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <div>
                                    LONGEVITY (HOURS): 
                                </div>
                                <div>
                                    <input type="number" 
                                           min="0"
                                           defaultValue={PN.database.currentMaterial.longevity}
                                           onChange={(event) => this._onChangeMaterial("longevity", event.target.value)}/>
                                </div>
                                
                            </td>
                            <td>
                                <div>
                                    IMPACT: 
                                </div>
                                <div>
                                    <input type="number" 
                                           min="0"
                                           defaultValue={PN.database.currentMaterial.impact}
                                           onChange={(event) => this._onChangeMaterial("impact", event.target.value)}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                RECOMMENDED DILUTION: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.dilute}
                                       onChange={(event) => this._onChangeMaterial("dilute", event.target.value)}/>
                            </td>
                            <td>
                                <div>
                                    AVG % USED IN CONCENTRATE: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={PN.sanitizeFloat(PN.parseFloat(PN.database.currentMaterial.avg_in_concentrate) * 100.0, 3)}
                                           onChange={(event) => this._onChangeMaterial("avg_in_concentrate", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    MAX % ADVISED IN CONCENTRATE: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={PN.sanitizeFloat(PN.parseFloat(PN.database.currentMaterial.max_in_concentrate) * 100.0, 3)}
                                           onChange={(event) => this._onChangeMaterial("max_in_concentrate", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                CAS NUMBER: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.cas}
                                       onChange={(event) => this._onChangeMaterial("cas", this._formatUpper(event.target.value))}/>
                            </td>
                            <td>
                                <div>
                                    IFRA RESTRICTED: 
                                </div>
                                <div>
                                    <select defaultValue={String(PN.database.currentMaterial.ifra_restricted)}
                                            onChange={(event) => this._onChangeMaterial("ifra_restricted", event.target.value === "true")}>
                                        <option value="false">FALSE</option>
                                        <option value="true">TRUE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <div>
                                    MAX % IN FINISHED PRODUCT: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           disabled={PN.database.currentMaterial.ifra_restricted === false}
                                           defaultValue={PN.sanitizeFloat(PN.parseFloat(PN.database.currentMaterial.max_in_finished_product) * 100.0, 3)}
                                           onChange={(event) => this._onChangeMaterial("max_in_finished_product", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="tagcell">
                                    NEW TAG: 
                                    <input className="databaseinput" 
                                        defaultValue={this.state.currentTag}
                                        onChange={(event) => this.setState({currentTag: event.target.value})}/>
                                </div>
                                <div className="tagbuttoncell">
                                    <button type="button" 
                                            onClick={() => this._tryCreateMaterialTag()}>
                                        Add New Tag To Material
                                    </button>
                                </div>
                            </td>
                            <td colSpan="2">
                                {materialTags}
                            </td>
                        </tr>
                        {this._renderMaterialCostRows()}
                        <tr>
                            <td>
                                <button type="button" 
                                        onClick={() => this._tryCreateDilution()}>
                                    Create Dilution Mixture For Current Material
                                </button>
                            </td>
                            <td>
                                SELECT DILUTANT:
                                <IngredientPicker defaultValue=''
                                                id={"loadsolvent"}
                                                allowSolvents={true}
                                                allowMaterials={false}
                                                allowMixtures={false}
                                                onChange={(id) => this._changeDilutantMaterial(id)}/>
                             </td>
                             <td>
                                <div>
                                    DILUTION %: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={this._dilutionAmount}
                                           onChange={(event) => this._onChangeDilution(PN.sanitizeFloat(PN.parseFloat(event.target.value), 4))}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td key={this.state.materialButtonKey} className="tablebottom">
                                <button type="button" 
                                        disabled={this._disableMaterialButton()}
                                        onClick={() => this._createOrUpdateMaterial()}>
                                    {matButtonLabel}
                                </button>
                                <button type="button" 
                                        onClick={() => this._loadMaterial()}>
                                    Load Selected Material
                                </button>
                            </td>
                            <td colSpan="2" className="tablebottom">
                                SELECT MATERIAL TO LOAD:
                                <IngredientPicker defaultValue={this._selectedMaterialID}
                                                  id={"loadmaterial"}
                                                  allowSolvents={true}
                                                  allowMixtures={false}
                                                  onChange={(id) => this._changeSelectedMaterial(id)}/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    MIXTURE EDITOR
                </div>
                <table className="ingredienttable" key={this.state.mixtureKey}>
                    <tbody>
                        <tr>
                            <td colSpan="2">
                                ID: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.id}
                                       onChange={(event) => this._onChangeMixture("id", this._formatLower(event.target.value))}/>
                            </td>
                            <td colSpan="2">
                                NAME: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.name}
                                       onChange={(event) => this._onChangeMixture("name", this._formatName(event.target.value))}/>
                            </td>
                            <td>
                                COMPANY NAME: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.company}
                                       onChange={(event) => this._onChangeMixture("company", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                CAS NUMBER (OPTIONAL): 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.cas}
                                       onChange={(event) => this._onChangeMixture("cas", this._formatUpper(event.target.value))}/>
                            </td>
                            <td>
                                <div>
                                    IS NATURAL?
                                </div>
                                <div>
                                    <select defaultValue={String(PN.database.currentMixture.is_natural)}
                                                onChange={(event) => this._onChangeMixture("is_natural", event.target.value === "true")}>
                                        <option value="false">FALSE</option>
                                        <option value="true">TRUE</option>
                                    </select>
                                </div>
                            </td>
                            <td colSpan="2">
                                COUNTRY OF ORIGIN: 
                                <input className="databaseinput" 
                                       disabled={PN.database.currentMixture.is_natural !== true}
                                       defaultValue={PN.database.currentMixture.is_natural ? PN.database.currentMixture.country : ""}
                                       onChange={(event) => this._onChangeMixture("country", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="5">
                                SCENT: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.scent}
                                       onChange={(event) => this._onChangeMixture("scent", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="5">
                                USAGE: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.usage}
                                       onChange={(event) => this._onChangeMixture("usage", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>
                                    NOTE: 
                                </div>
                                <div>
                                    <select value={PN.database.currentMixture.note || " "} 
                                            onChange={(event) => this._onChangeMixture("note", event.target.value)}>
                                        <option value=" ">NONE</option>
                                        <option value="TOP">TOP</option>
                                        <option value="HEART">HEART</option>
                                        <option value="BASE">BASE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                <div>
                                    LONGEVITY (HOURS): 
                                </div>
                                <div>
                                    <input type="number" 
                                           min="0"
                                           defaultValue={PN.database.currentMixture.longevity}
                                           onChange={(event) => this._onChangeMixture("longevity", event.target.value)}/>
                                </div>
                                
                            </td>
                            <td>
                                <div>
                                    IMPACT: 
                                </div>
                                <div>
                                    <input type="number" 
                                           min="0"
                                           defaultValue={PN.database.currentMixture.impact}
                                           onChange={(event) => this._onChangeMixture("impact", event.target.value)}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    AVG % USED IN CONCENTRATE: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={PN.sanitizeFloat(PN.parseFloat(PN.database.currentMixture.avg_in_concentrate) * 100.0, 3)}
                                           onChange={(event) => this._onChangeMixture("avg_in_concentrate", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                                </div>
                            </td>
                            <td>
                                <div>
                                    MAX % ADVISED IN CONCENTRATE: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={PN.sanitizeFloat(PN.parseFloat(PN.database.currentMixture.max_in_concentrate) * 100.0, 3)}
                                           onChange={(event) => this._onChangeMixture("max_in_concentrate", PN.sanitizeFloat(PN.parseFloat(event.target.value) * 0.01, 6))}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <div className="tagcell">
                                    NEW TAG: 
                                    <input className="databaseinput" 
                                        defaultValue={this.state.currentMixtureTag}
                                        onChange={(event) => this.setState({currentMixtureTag: event.target.value})}/>
                                </div>
                                <div className="tagbuttoncell">
                                    <button type="button" 
                                            onClick={() => this._tryCreateMixtureTag()}>
                                        Add New Tag To Mixture
                                    </button>
                                </div>
                            </td>
                            <td colSpan="3">
                                {mixtureTags}
                            </td>
                        </tr>
                        {this._renderMixtureRows()}
                        <tr>
                            <td colSpan="2">
                                <button type="button" 
                                        onClick={() => this._tryCreateMixtureDilution()}>
                                    Create Dilution Mixture For Current Mixture
                                </button>
                            </td>
                            <td colSpan="2">
                                SELECT DILUTANT:
                                <IngredientPicker defaultValue=''
                                                id={"loadsolvent"}
                                                allowSolvents={true}
                                                allowMaterials={false}
                                                allowMixtures={false}
                                                onChange={(id) => this._changeMixtureDilutantMaterial(id)}/>
                             </td>
                             <td>
                                <div>
                                    DILUTION %: 
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           max="100"
                                           defaultValue={this._dilutionAmount}
                                           onChange={(event) => this._onChangeMixtureDilution(PN.sanitizeFloat(PN.parseFloat(event.target.value), 4))}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2" key={this.state.mixtureButtonKey} className="tablebottom">
                                <button type="button" 
                                        disabled={this._disableMixtureButton()}
                                        onClick={() => this._createOrUpdateMixture()}>
                                    {mixButtonLabel}
                                </button>
                                <button type="button" 
                                        onClick={() => this._loadMixture()}>
                                    Load Selected Mixture
                                </button>
                            </td>
                            <td colSpan="3" className="tablebottom">
                                SELECT MIXTURE TO LOAD:
                                <IngredientPicker defaultValue={this._selectedMixtureID}
                                                  id={"loadmixture"}
                                                  allowSolvents={false}
                                                  allowMaterials={false}
                                                  allowMixtures={true}
                                                  onChange={(id) => this._changeSelectedMixture(id)}/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="padding"/>
            </div>
        );
    }
}