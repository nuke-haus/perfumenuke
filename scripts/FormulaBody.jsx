class FormulaBody extends React.Component {

    state = {
        formulaKey: "table",
        detailsKey: "details",
        formulaButtonKey: "button"
    };

    _selectedFormulaID = "";

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

    _addIngredient() {
        PN.database.activeFormula.ingredients.push({id: "", quantity: 0.0});
        PN.recomputeFormula();
        this.forceUpdate();
    }

    _deleteIngredient(index) {
        PN.database.activeFormula.ingredients.splice(index, 1);
        PN.recomputeFormula();
        this.setState({tableKey: PN.guid()});
    }

    _onChangeFormula(key, value, recompute) {
        PN.database.activeFormula[key] = value;
        if (recompute) {
            PN.recomputeFormula();
        }
        this.setState({formulaButtonKey: PN.guid(), detailsKey: PN.guid()});
    }

    _changeIngredient(id, ingredient) {
        ingredient.id = id;
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _changeQuantity(value, ingredient) {
        ingredient.quantity = Math.max(parseFloat(value), 0.0);
        PN.recomputeFormula();
        this.setState({detailsKey: PN.guid()});
    }

    _renderPercentInProduct(id, material) {
        const floatValue = (PN.database.activeFormula.computed[id].percentInProduct || 0).toPrecision(6);
        if (material.max_in_finished_product && floatValue > (material.max_in_finished_product * 100.0)) {
            return (
                <span className="error">{floatValue}</span>
            );
        } 
        return floatValue;
    }

    _getTooltip(id) {
        const material = PN.getMaterial(id);
        let tooltip = "";
        if (material != null) {
            tooltip = material.scent + " " + material.usage;
        } 
        return tooltip;
    }

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
        this.setState({formulaKey: PN.guid(), formulaButtonKey: PN.guid()});
    }

    _hasValidFormulaID() {
        return !!PN.database.activeFormula.id;
    }

    _currentFormulaIsDirty() {
        const formula = PN.getFormula(PN.database.activeFormula.id || "");
        return !PN.areEqual(formula, PN.database.activeFormula);
    }

    _disableFormulaButton() {
        if (!this._hasValidFormulaID()) {
            return true;
        }
        return !this._currentFormulaIsDirty();
    }

    _createOrUpdateFormula() {
        if (!this._hasValidFormulaID()) {
            return;
        }
        const validationData = PN.validateFormula(PN.database.activeFormula);
        if (validationData.error) {
            alert(validationData.error);
            return;
        }
        if (validationData.formula) {
            PN.setFormula(validationData.formula);
            this.setState({formulaButtonKey: PN.guid()});
        }
    }

    _changeSelectedFormula(id) {
        this._selectedFormulaID = id;
    }

    _loadFormula() {
        const data = PN.getFormula(this._selectedFormulaID);
        if (data != null) {
            PN.database.activeFormula = PN.deepCopy(data);
            this.setState({formulaKey: PN.guid(), detailsKey: PN.guid(), formulaButtonKey: PN.guid()});
        }
    }

    _exportFormulas() {
        const data = PN.getFormulasForExport();
        this._downloadLink.setAttribute('href', 'data:application/JSON;charset=utf-8,' + encodeURIComponent(data));
        this._downloadLink.setAttribute('download', "formulas.json");
        this._downloadLink.click();
    }

    _renderDetailsRows() {
        const elements = [];
        for (let id in PN.database.activeFormula.computed) {
            const material = PN.getMaterial(id);
            const maxInProduct = material.max_in_finished_product == null 
                ? "" 
                : (material.max_in_finished_product * 100.0);
            const avgInConc = material.avg_in_concentrate == null 
                ? "" 
                : (material.avg_in_concentrate * 100.0);
            const maxInConc = material.max_in_concentrate == null 
                ? "" 
                : (material.max_in_concentrate * 100.0);
            elements.push(
                <tr key={'detail' + id}>
                    <td><div data-tooltip={this._getTooltip(material.id)}>{material.name || "???"}</div></td>
                    <td>{(PN.database.activeFormula.computed[id].quantity || 0).toPrecision(4)}</td>
                    <td>{(PN.database.activeFormula.computed[id].percent || 0).toPrecision(6)}</td>
                    <td>{avgInConc}</td>
                    <td>{maxInConc}</td>
                    <td>{this._renderPercentInProduct(id, material)}</td>
                    <td>{maxInProduct}</td>
                </tr>
            );
        }
        return elements;
    }

    render() {
        const formulaExistsInDatabase = PN.getFormula(PN.database.activeFormula.id || "") != null;
        const formulaButtonLabel = formulaExistsInDatabase
            ? "Save Current Formula"
            : "Create New Formula";
        const elements = [];
        for (let index in PN.database.activeFormula.ingredients || []) {
            const ingredient = PN.database.activeFormula.ingredients[index]
            elements.push(
                <tr key={"ingredient" + index + this.state.tableKey}>
                    <td>
                        INGREDIENT:
                        <IngredientPicker defaultValue={ingredient.id}
                                          id={"ingredient" + index}
                                          onChange={(id) => this._changeIngredient(id, ingredient)}/>
                    </td>
                    <td>
                        <div>
                            WEIGHT (GRAMS):
                        </div>
                        <div>
                            <input type="number" 
                                   step="0.001" 
                                   min="0"
                                   defaultValue={ingredient.quantity || 0.0} 
                                   onChange={(event) => this._changeQuantity(event.target.value, ingredient)}/>
                        </div>
                    </td>
                    <td>
                        <button type="button" 
                                onClick={() => this._deleteIngredient(index)}>
                            Delete
                        </button>
                    </td>
                </tr>
            );
        }

        return (
            <div>
                <a ref={(ref) => this._downloadLink = ref}/>
                <div className="tabletext">
                    IMPORT AND EXPORT DATA
                </div>
                <table className="ingredienttable">
                    <tbody>
                        <tr>
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
                            <td>
                                <button type="button" 
                                        onClick={() => this._exportFormulas()}>
                                    Export All Formulas
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    FORMULA EDITOR
                </div>
                <table className="ingredienttable" key={this.state.formulaKey}>
                    <tbody>
                        <tr>
                            <td>
                                ID: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.activeFormula.id}
                                       onChange={(event) => this._onChangeFormula("id", this._formatLower(event.target.value))}/>
                            </td>
                            <td>
                                NAME: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.activeFormula.name}
                                       onChange={(event) => this._onChangeFormula("name", this._formatName(event.target.value))}/>
                            </td>
                            <td>
                                DATE CREATED: 
                                <input className="databaseinput" 
                                       type="date"
                                       defaultValue={PN.database.activeFormula.date}
                                       onChange={(event) => this._onChangeFormula("date", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                DESCRIPTION: 
                                <input className="databaseinput" 
                                       defaultValue={PN.database.activeFormula.description}
                                       onChange={(event) => this._onChangeFormula("description", this._formatName(event.target.value))}/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                NOTES: 
                                <textarea onChange={(event) => this._onChangeFormula("notes", this._formatName(event.target.value))}
                                          defaultValue={PN.database.activeFormula.notes}
                                          rows="5">
                                </textarea>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                DILUTANT:
                                <IngredientPicker defaultValue={PN.database.activeFormula.dilutant}
                                                    id={"dilutant"}
                                                    allowSolvents={true}
                                                    allowMixtures={false}
                                                    allowMaterials={false}
                                                    onChange={(id) => this._onChangeFormula("dilution", id, true)}/>
                            </td>
                            <td>
                                <div>
                                    WEIGHT (GRAMS):
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           defaultValue={PN.database.activeFormula.dilutant_quantity} 
                                           onChange={(event) => this._onChangeFormula("dilutant_quantity", Math.max(parseFloat(event.target.value), 0.0), true)}/>
                                </div>
                            </td>
                        </tr>
                        {elements}
                        <tr>
                            <td colSpan="3">
                                <button type="button" 
                                        onClick={() => this._addIngredient()}>
                                    Add New Ingredient
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td key={this.state.formulaButtonKey} className="tablebottom">
                                <button type="button" 
                                        disabled={this._disableFormulaButton()}
                                        onClick={() => this._createOrUpdateFormula()}>
                                    {formulaButtonLabel}
                                </button>
                                <button type="button" 
                                        onClick={() => this._loadFormula()}>
                                    Load Selected Formula
                                </button>
                            </td>
                            <td colSpan="2" className="tablebottom">
                                SELECT FORMULA TO LOAD:
                                <IngredientPicker defaultValue={this._selectedFormulaID}
                                                  id={"loadformula"}
                                                  allowSolvents={false}
                                                  allowMaterials={false}
                                                  allowMixtures={false}
                                                  allowFormulas={true}
                                                  onChange={(id) => this._changeSelectedFormula(id)}/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    MATERIAL MANIFEST
                </div>
                <table className="formulatable" key={this.state.detailsKey}>
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>WEIGHT (GRAMS)</th>
                            <th>% IN CONCENTRATE</th>
                            <th>AVG % USED IN CONCENTRATE</th>
                            <th>MAX % ADVISED IN CONCENTRATE</th>
                            <th>% IN FINISHED PRODUCT</th>
                            <th>MAX % IN FINISHED PRODUCT (IFRA)</th>
                        </tr>
                        {this._renderDetailsRows()}
                    </tbody>
                </table>
            </div>
        );
    }
}