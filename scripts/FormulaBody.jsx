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

    _applyScale() {
        for (let ingredient of PN.database.activeFormula.ingredients) {
            ingredient.quantity = PN.sanitizeFloat(ingredient.quantity * (PN.database.activeFormula.scale || 1.0), 4);
        }
        PN.database.activeFormula.dilutant_quantity = PN.sanitizeFloat(PN.database.activeFormula.dilutant_quantity * (PN.database.activeFormula.scale || 1.0), 4);
        PN.recomputeFormula();
        this.setState({formulaKey: PN.guid()});
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

    _getTooltip(id) {
        const material = PN.getMaterial(id);
        let tooltip = "";
        if (material != null) {
            tooltip = material.scent + " " + material.usage;
        } 
        return tooltip;
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
            PN.persistInLocalStore();
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
            PN.recomputeFormula();
            this.setState({formulaKey: PN.guid(), detailsKey: PN.guid(), formulaButtonKey: PN.guid()});
        }
    }

    _renderPercentInProduct(id, material) {
        const floatValue = (PN.database.activeFormula.computed.ingredients[id].percentInProduct || 0);
        if (material.max_in_finished_product && floatValue > (material.max_in_finished_product * 100.0)) {
            return (
                <span className="error">{floatValue}</span>
            );
        } 
        return floatValue;
    }

    _renderManifestRows() {
        const elements = [];
        for (let id in PN.database.activeFormula.computed.ingredients) {
            const material = PN.getMaterial(id);
            const maxInProduct = material.max_in_finished_product == null 
                ? "" 
                : PN.sanitizeFloat(material.max_in_finished_product * 100.0, 4);
            const avgInConc = material.avg_in_concentrate == null || material.max_in_concentrate == 0
                ? "" 
                : PN.sanitizeFloat(material.avg_in_concentrate * 100.0, 4);
            const maxInConc = material.max_in_concentrate == null || material.max_in_concentrate == 0
                ? "" 
                : PN.sanitizeFloat(material.max_in_concentrate * 100.0, 4);
            elements.push(
                <tr key={'manifest' + id}>
                    <td><InfoButton material={material}/></td>
                    <td>{(PN.database.activeFormula.computed.ingredients[id].quantity || 0)}</td>
                    <td>{(PN.database.activeFormula.computed.ingredients[id].ppt || 0)}</td>
                    <td>{(PN.database.activeFormula.computed.ingredients[id].percent || 0)}</td>
                    <td>{avgInConc}</td>
                    <td>{maxInConc}</td>
                    <td>{this._renderPercentInProduct(id, material)}</td>
                    <td>{maxInProduct}</td>
                </tr>
            );
        }
        return elements;
    }

    _renderDetailsRows() {
        return (
            <tr>
                <td>{PN.database.activeFormula.computed.concentration}</td>
                <td>{PN.database.activeFormula.computed.concentrationNonSolvent}</td>
                <td>{PN.database.activeFormula.computed.concentrationWeight}</td>
                <td>{PN.database.activeFormula.computed.concentrationNonSolventWeight}</td>
                <td>{PN.database.activeFormula.computed.totalWeight}</td>
            </tr>  
        );
    }

    _renderComputed() {
        if (PN.database.activeFormula.ingredients.length === 0 || PN.database.activeFormula.computed.concentrationWeight == null) {
            return null;
        }
        return (
            <div key={this.state.detailsKey}>
                <div className="tabletext">
                    FORMULA DETAILS
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th>CONCENTRATION % INCL. SOLVENTS</th>
                            <th>CONCENTRATION %</th>
                            <th>CONCENTRATE INCL. SOLVENTS WEIGHT (GRAMS)</th>
                            <th>CONCENTRATE WEIGHT (GRAMS)</th>
                            <th>FINISHED PRODUCT WEIGHT (GRAMS)</th>
                        </tr>
                        {this._renderDetailsRows()}
                    </tbody>
                </table>
                <div className="tabletext">
                    MATERIAL MANIFEST
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th>MATERIAL</th>
                            <th>WEIGHT (GRAMS)</th>
                            <th>PARTS PER THOUSAND IN CONCENTRATE</th>
                            <th>% IN CONCENTRATE</th>
                            <th>AVG % USED IN CONCENTRATE</th>
                            <th>MAX % ADVISED IN CONCENTRATE</th>
                            <th>% IN FINISHED PRODUCT</th>
                            <th>MAX % IN FINISHED PRODUCT (IFRA)</th>
                        </tr>
                        {this._renderManifestRows()}
                    </tbody>
                </table>
                <div className="padding"/>
            </div>
        );
    }

    render() {
        const formulaExistsInDatabase = PN.getFormula(PN.database.activeFormula.id || "") != null;
        const formulaButtonLabel = formulaExistsInDatabase
            ? "Save Current Formula"
            : "Create New Formula";
        const elements = [];
        let count = 1;
        for (let index in PN.database.activeFormula.ingredients || []) {
            const ingredient = PN.database.activeFormula.ingredients[index];
            const name = `INGREDIENT ${count}:`;
            count = count + 1;
            elements.push(
                <tr key={"ingredient" + index + this.state.tableKey}>
                    <td>
                        {name}
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
                                   defaultValue={PN.parseFloat(ingredient.quantity)} 
                                   onChange={(event) => this._changeQuantity(PN.parseFloat(event.target.value), ingredient)}/>
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
                                <textarea onChange={(event) => this._onChangeFormula("description", this._formatName(event.target.value))}
                                          defaultValue={PN.database.activeFormula.description}
                                          className="resizableText"
                                          rows="6">
                                </textarea>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3">
                                OTHER NOTES: 
                                <textarea onChange={(event) => this._onChangeFormula("notes", this._formatName(event.target.value))}
                                          defaultValue={PN.database.activeFormula.notes}
                                          className="resizableText"
                                          rows="6">
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
                                           defaultValue={PN.parseFloat(PN.database.activeFormula.dilutant_quantity)} 
                                           onChange={(event) => this._onChangeFormula("dilutant_quantity", PN.parseFloat(event.target.value), true)}/>
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
                            <td>
                                <button type="button" 
                                        onClick={() => this._applyScale()}>
                                    Apply Scale Value To Entire Formula
                                </button>
                            </td>
                            <td colSpan="2">
                                <div>
                                    SCALE:
                                </div>
                                <div>
                                    <input type="number" 
                                           step="0.001" 
                                           min="0"
                                           defaultValue={PN.parseFloat(PN.database.activeFormula.scale || 1.0)} 
                                           onChange={(event) => this._onChangeFormula("scale", PN.parseFloat(event.target.value), false)}/>
                                </div>
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
                {this._renderComputed()}
            </div>
        );
    }
}