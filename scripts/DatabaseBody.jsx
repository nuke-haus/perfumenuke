class DatabaseBody extends React.Component {

    state = {
        materialKey: "mat",
        materialButtonKey: "matButton",
        mixtureKey: "mix",
        mixtureButtonKey: "mixButton"
    };

    _selectedMaterialID = "";
    _selectedMixtureID = "";

    // MISC LOGIC
    // --------------------------------------------------------------------------------------

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
        if (key === "ifra_restricted") { // force a rerender
            if (value === false) {
                PN.database.currentMaterial.max_in_finished_product = null;
            }
            this.setState({materialKey: PN.guid()});
        }
        PN.database.currentMaterial[key] = value;
        this.setState({materialButtonKey: PN.guid()});
    }

    _createOrUpdateMaterial() {
        if (!this._hasValidID()) {
            return;
        }
        PN.setMaterial(PN.database.currentMaterial);
        this.setState({materialButtonKey: PN.guid()});
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

    _loadMaterial() {
        const material = PN.getMaterial(this._selectedMaterialID);
        if (material != null) {
            PN.database.currentMaterial = PN.deepCopy(material);
            this.setState({materialKey: PN.guid()});
        }
    }

    // MIXTURE LOGIC
    // --------------------------------------------------------------------------------------

    _onChangeMixture(key, value) {
        PN.database.currentMixture[key] = value;
        this.setState({mixtureButtonKey: PN.guid()});
    }

    _createOrUpdateMixture() {
        if (!this._hasValidMixtureID()) {
            return;
        }
        PN.setMixture(PN.database.currentMixture);
        this.setState({mixtureButtonKey: PN.guid()});
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

    // RENDER
    // --------------------------------------------------------------------------------------

    _renderMixtureRows() {
        const elements = [];
        for (let index in PN.database.currentMixture.materials || []) {
            const matData = PN.database.currentMixture.materials[index];
            const label = `MATERIAL ${parseInt(index) + 1}:`
            elements.push(
                <tr key={"mixturematerial" + index}>
                    <td>
                        {label}
                        <IngredientPicker defaultValue={matData.id}
                                          id={"loadmaterial"}
                                          allowSolvents={true}
                                          allowMixtures={false}
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
                                   defaultValue={(parseFloat(matData.percent) * 100.0)}
                                   onChange={(event) =>  this._changeMixtureMaterial(index, "percent", 0.01 * parseFloat(event.target.value || "0"))}/>
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
                <td colSpan="3">
                    <button type="button" 
                            onClick={() => this._addMaterialToMixture()}>
                        Add Material To Mixture
                    </button>
                </td>
            </tr>
        );
        return elements;
    }

    render() {
        const matExistsInDatabase = PN.getMaterial(PN.database.currentMaterial.id || "") != null;
        const matButtonLabel = matExistsInDatabase
            ? "Update Current Material"
            : "Create New Material";
        const mixExistsInDatabase = PN.getMixture(PN.database.currentMixture.id || "") != null;
        const mixButtonLabel = mixExistsInDatabase
            ? "Update Current Mixture"
            : "Create New Mixture";
        return (
            <div>
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
                                COMPANY: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.company}
                                       onChange={(event) => this._onChangeMaterial("company", this._formatName(event.target.value))}/>
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
                                    <select defaultValue={PN.database.currentMaterial.note} 
                                            onChange={(event) => this._onChangeMaterial("note", this._formatLower(event.target.value))}>
                                        <option value="TOP">TOP</option>
                                        <option value="HEART">HEART</option>
                                        <option value="BASE">BASE</option>
                                    </select>
                                </div>
                            </td>
                            <td>
                                LONGEVITY: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMaterial.longevity}
                                       onChange={(event) => this._onChangeMaterial("longevity", event.target.value)}/>
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
                                           defaultValue={PN.database.currentMaterial.avg_in_concentrate}
                                           onChange={(event) => this._onChangeMaterial("avg_in_concentrate", event.target.value)}/>
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
                                           defaultValue={PN.database.currentMaterial.max_in_concentrate}
                                           onChange={(event) => this._onChangeMaterial("max_in_concentrate", event.target.value)}/>
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
                                        <option value="true">TRUE</option>
                                        <option value="false">FALSE</option>
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
                                           disabled={PN.database.currentMaterial.ifra_restricted === false}
                                           defaultValue={PN.database.currentMaterial.max_in_finished_product}
                                           onChange={(event) => this._onChangeMaterial("max_in_finished_product", event.target.value)}/>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td key={this.state.materialButtonKey}>
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
                            <td colSpan="2">
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
                            <td>
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
                        </tr>
                        <tr>
                            <td colSpan="3">
                                SCENT: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.scent}
                                       onChange={(event) => this._onChangeMixture("scent", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                USAGE: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.currentMixture.usage}
                                       onChange={(event) => this._onChangeMixture("usage", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        {this._renderMixtureRows()}
                        <tr>
                            <td key={this.state.mixtureButtonKey}>
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
                            <td colSpan="2">
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
            </div>
        );
    }
}