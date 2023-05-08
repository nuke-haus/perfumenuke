class FormulaBody extends React.Component {

    state = {
        formulaKey: "table",
        detailsKey: "details",
        formulaButtonKey: "button",
        formulaRenderKey: "formula",
        sortBy: "PPT",
        sortDir: 1,
        showArchivedFormulas: false,
        isDirty: false,
    };

    _SORT_BY_ID = "ID";
    _SORT_BY_WEIGHT = "WEIGHT"; 
    _SORT_BY_PERCENT_CONC = "PERCENT_CONC";
    _SORT_BY_PERCENT_TOTAL = "PERCENT_TOTAL";
    _SORT_BY_PPT = "PPT";

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

    _onChangeFormula(key, value, recompute, updateButton) {
        PN.database.activeFormula[key] = value;
        if (recompute) {
            PN.recomputeFormula();
            this.setState({detailsKey: PN.guid()});
        } else {
            if (updateButton) {
                this.setState({formulaButtonKey: PN.guid()});
            } else if (!this.state.isDirty) {
                this.setState({isDirty: true, formulaButtonKey: PN.guid()});
            }
        }
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

    _onClickSort(sortType, curDir) {
        const newDir = (this.state.sortBy === sortType)
            ? curDir * -1
            : 1;
        this.setState({sortBy: sortType, sortDir: newDir});
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
        if (this.state.isDirty) {
            return false;
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
            this.setState({formulaButtonKey: PN.guid(), isDirty: false});
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
            this.setState({formulaKey: PN.guid(), detailsKey: PN.guid(), formulaButtonKey: PN.guid(), isDirty: false});
        }
    }

    _renderPercentInProduct(id, material, source) {
        const floatValue = (source[id].percentInProduct || 0);
        if (material.max_in_finished_product && floatValue > (material.max_in_finished_product * 100.0)) {
            return (
                <span className="error">{`${floatValue} \u{1F6A9}`}</span>
            );
        } 
        return floatValue;
    }

    _getOrderedManifestKeys(source) {
        const keys = Object.keys(source);
        switch (this.state.sortBy) {
            case (this._SORT_BY_ID) :
                return keys.sort((a, b) => {
                    var aMaterial = (PN.getMaterial(a) || PN.getMixture(a)) || {};
                    var bMaterial = (PN.getMaterial(b) || PN.getMixture(b)) || {};
                    return (aMaterial.name || "").localeCompare(bMaterial.name || "") * this.state.sortDir;
                });
            case (this._SORT_BY_PERCENT_TOTAL):
            case (this._SORT_BY_WEIGHT):
                return keys.sort((a, b) => {
                    const aValue = source[a].quantity;
                    const bValue = source[b].quantity;
                    return (bValue - aValue) * this.state.sortDir;
                });
            case (this._SORT_BY_PERCENT_CONC):
            case (this._SORT_BY_PPT):
            default:
                return keys.sort((a, b) => {
                    const aValue = source[a].percent;
                    const bValue = source[b].percent;
                    return (bValue - aValue) * this.state.sortDir;
                });
        }
    }

    _renderManifestRows(isBreakdown) {
        const elements = [];
        var source = PN.database.activeFormula.computed.breakdown;
        if (!isBreakdown) {
            source = PN.database.activeFormula.computed.manifest;
        }
        var count = 0;
        for (let id of this._getOrderedManifestKeys(source)) {
            count++;
            const material = PN.getMaterial(id);
            const mixture = PN.getMixture(id);
            if (material != null) {
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
                    <tr key={'manifest_material' + id}>
                        <td>{count}</td>
                        <td><InfoButton material={material}/></td>
                        <td>{(source[id].quantity || 0)}</td>
                        <td>{(source[id].ppt || 0)}</td>
                        <td>{(source[id].percent || 0)}</td>
                        <td>{avgInConc}</td>
                        <td>{maxInConc}</td>
                        <td>{this._renderPercentInProduct(id, material, source)}</td>
                        <td>{maxInProduct}</td>
                    </tr>
                );
            } else {
                const maxInProduct = mixture.max_in_finished_product == null 
                    ? "" 
                    : PN.sanitizeFloat(mixture.max_in_finished_product * 100.0, 4);
                const avgInConc = mixture.avg_in_concentrate == null || mixture.max_in_concentrate == 0
                    ? "" 
                    : PN.sanitizeFloat(mixture.avg_in_concentrate * 100.0, 4);
                const maxInConc = mixture.max_in_concentrate == null || mixture.max_in_concentrate == 0
                    ? "" 
                    : PN.sanitizeFloat(mixture.max_in_concentrate * 100.0, 4);
                elements.push(
                    <tr key={'manifest_mixture' + id}>
                        <td>{count}</td>
                        <td><InfoButton material={mixture}/></td>
                        <td>{(source[id].quantity || 0)}</td>
                        <td>{(source[id].ppt || 0)}</td>
                        <td>{(source[id].percent || 0)}</td>
                        <td>{avgInConc}</td>
                        <td>{maxInConc}</td>
                        <td>{this._renderPercentInProduct(id, mixture, source)}</td>
                        <td>{maxInProduct}</td>
                    </tr>
                );
            } 
        }
        return elements;
    }

    _renderDetailsRow() {
        return (
            <tr>
                <td>{PN.database.activeFormula.computed.proportions["TOP"]}</td>
                <td>{PN.database.activeFormula.computed.proportions["HEART"]}</td>
                <td>{PN.database.activeFormula.computed.proportions["BASE"]}</td>
                <td>{PN.database.activeFormula.computed.concentrationNonSolvent}</td>
                <td>{PN.database.activeFormula.computed.concentrationNonSolventWeight}</td>
                <td>{PN.database.activeFormula.computed.totalWeight}</td>
            </tr>  
        );
    }

    _renderSortButton(text, sortType) {
        var sortEmoji = "\u{1F7E6}";
        if (this.state.sortBy === sortType) {
            if (this.state.sortDir === 1) {
                sortEmoji = "\u{1F53D}";
            } else {
                sortEmoji = "\u{1F53C}";
            }
        } 
        return (
            <React.Fragment>
                {text}
                <span className="sortbutton" onClick={() => this._onClickSort(sortType, this.state.sortDir)}>
                    {sortEmoji}
                </span>
            </React.Fragment>
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
                <table className="formulatablesmall">
                    <tbody>
                        <tr>
                            <th>TOP NOTE %</th>
                            <th>HEART NOTE %</th>
                            <th>BASE NOTE %</th>
                            <th>CONCENTRATION %</th>
                            <th>CONCENTRATE WEIGHT (GRAMS)</th>
                            <th>FINISHED PRODUCT WEIGHT (GRAMS)</th>
                        </tr>
                        {this._renderDetailsRow()}
                    </tbody>
                </table>
                <div className="tabletext">
                    FORMULA MANIFEST
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th colSpan="2">{this._renderSortButton("MATERIAL", this._SORT_BY_ID)}</th>
                            <th>{this._renderSortButton("WEIGHT (GRAMS)", this._SORT_BY_WEIGHT)}</th>
                            <th>{this._renderSortButton("PARTS PER THOUSAND IN CONCENTRATE", this._SORT_BY_PPT)}</th>
                            <th>{this._renderSortButton("% IN CONCENTRATE", this._SORT_BY_PERCENT_CONC)}</th>
                            <th>AVG % USED IN CONCENTRATE</th>
                            <th>MAX % ADVISED IN CONCENTRATE</th>
                            <th>{this._renderSortButton("% IN FINISHED PRODUCT", this._SORT_BY_PERCENT_TOTAL)}</th>
                            <th>MAX % IN FINISHED PRODUCT (IFRA)</th>
                        </tr>
                        {this._renderManifestRows(false)}
                    </tbody>
                </table>
                <div className="tabletext">
                    DETAILED FORMULA BREAKDOWN
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th colSpan="2">{this._renderSortButton("MATERIAL", this._SORT_BY_ID)}</th>
                            <th>{this._renderSortButton("WEIGHT (GRAMS)", this._SORT_BY_WEIGHT)}</th>
                            <th>{this._renderSortButton("PARTS PER THOUSAND IN CONCENTRATE", this._SORT_BY_PPT)}</th>
                            <th>{this._renderSortButton("% IN CONCENTRATE", this._SORT_BY_PERCENT_CONC)}</th>
                            <th>AVG % USED IN CONCENTRATE</th>
                            <th>MAX % ADVISED IN CONCENTRATE</th>
                            <th>{this._renderSortButton("% IN FINISHED PRODUCT", this._SORT_BY_PERCENT_TOTAL)}</th>
                            <th>MAX % IN FINISHED PRODUCT (IFRA)</th>
                        </tr>
                        {this._renderManifestRows(true)}
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
                    <td colSpan="2">
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
                                       onChange={(event) => this._onChangeFormula("id", this._formatLower(event.target.value), false, true)}/>
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
                            <td>
                                <TickBox ticked={PN.database.activeFormula.archived}
                                         onClick={(value) => this._onChangeFormula("archived", value)}
                                         label="ARCHIVED"/>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="4">
                                DESCRIPTION: 
                                <textarea onChange={(event) => this._onChangeFormula("description", this._formatName(event.target.value))}
                                          defaultValue={PN.database.activeFormula.description}
                                          rows="6">
                                </textarea>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="4">
                                OTHER NOTES: 
                                <textarea onChange={(event) => this._onChangeFormula("notes", this._formatName(event.target.value))}
                                          defaultValue={PN.database.activeFormula.notes}
                                          rows="6">
                                </textarea>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                DILUTANT:
                                <IngredientPicker defaultValue={PN.database.activeFormula.dilutant}
                                                    id={"dilutant"}
                                                    allowSolvents={true}
                                                    allowMixtures={false}
                                                    allowMaterials={false}
                                                    onChange={(id) => this._onChangeFormula("dilution", id, true)}/>
                            </td>
                            <td colSpan="2">
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
                            <td colSpan="4">
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
                            <td colSpan="3">
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
                                <div key={this.state.formulaRenderKey}>
                                    SELECT FORMULA TO LOAD:
                                    <IngredientPicker defaultValue={this._selectedFormulaID}
                                                    id={"loadformula"}
                                                    allowSolvents={false}
                                                    allowMaterials={false}
                                                    allowMixtures={false}
                                                    allowFormulas={true}
                                                    allowArchivedFormulas={this.state.showArchivedFormulas}
                                                    onChange={(id) => this._changeSelectedFormula(id)}/>
                                </div>
                            </td>
                            <td className="tablebottom">
                                <TickBox ticked={this.state.showArchivedFormulas}
                                         onClick={(value) => this.setState({showArchivedFormulas: value, formulaRenderKey: "formula" + String(value)})}
                                         label="SHOW ARCHIVED FORMULAS"/>
                            </td>
                        </tr>
                    </tbody>
                </table>
                {this._renderComputed()}
            </div>
        );
    }
}