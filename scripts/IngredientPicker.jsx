class IngredientPicker extends React.Component {

    constructor(props) {
        super(props);
    }

    _getDefaultValue() { // convert an ID to a display name
        const material = PN.getMaterial(this.props.defaultValue);
        const mix = PN.getMixture(this.props.defaultValue);
        if (mix != null) {
            const dilutionSolvent = PN.getMixtureDilutant(mix);
            if (dilutionSolvent != null) {
                return mix.name + PN.getDilutionPercentString(dilutionSolvent);
            } else {
                if (mix.is_natural && !PN.isBlankString(mix.country)) {
                    return `${mix.name} from ${mix.country}`;
                }
                return mix.name;
            }
        } else if (material != null) {
            if (material.is_natural && !PN.isBlankString(material.country)) {
                return `${material.name} from ${material.country}`;
            }
            return material.name;
        }
        return null;
    }

    _renderDataList() {
        this._nameMap = {};
        const elements = [];
        let count = 0;
        for (let id of PN.getAllSortedMaterialIDs()) {
            const material = PN.getMaterial(id);
            if ((this.props.allowMaterials && !material.is_solvent) || (this.props.allowSolvents && material.is_solvent)) {
                let name = material.name;
                if (material.is_natural && !PN.isBlankString(material.country)) {
                    name = `${material.name} from ${material.country}`;
                }
                count = count + 1;
                this._nameMap[name] = material.id;
                elements.push(<option key={"material" + count} value={name}/>);
            }
        }
        if (this.props.allowMixtures) {
            for (let id of PN.getAllSortedMixtureIDs()) {
                const mix = PN.getMixture(id);
                const dilutionSolvent = PN.getMixtureDilutant(mix);
                count = count + 1;
                if (dilutionSolvent != null) {
                    const name = mix.name + PN.getDilutionPercentString(dilutionSolvent);
                    this._nameMap[name] = mix.id;
                    elements.push(<option key={"dilution" + count} value={name}/>);
                } else {
                    let name = mix.name;
                    if (mix.is_natural && !PN.isBlankString(mix.country)) {
                        name = `${mix.name} from ${mix.country}`;
                    }
                    this._nameMap[name] = mix.id;
                    elements.push(<option key={"mixture" + count} value={name}/>);
                }   
            }
        }
        if (this.props.allowFormulas) {
            for (let id of PN.getAllSortedFormulaIDs()) {
                const formula = PN.getFormula(id);
                if (formula != null && formula.archived === true && !this.props.allowArchivedFormulas) {
                    continue;
                }
                count = count + 1;
                if (formula != null) {
                    this._nameMap[formula.name] = formula.id;
                    elements.push(<option key={"formula" + count} value={formula.name}/>);
                } 
            }
        }
        return (
            <datalist id={this.props.id}>
                {elements}
            </datalist>
        );
    }

    _onChange(value) {
        const id = this._nameMap[value]; // retrieve the ID using the display name 
        this.props.onChange(id);
    }

    render() {
        return (
            <div>
                {this._renderDataList()}
                <input list={this.props.id} 
                        className="ingredientpicker"
                        defaultValue={this._getDefaultValue()} 
                        onChange={(event) => this._onChange(event.target.value)}/>
            </div>
        );
    }
}

IngredientPicker.defaultProps = {
    allowArchivedFormulas: false,
    allowFormulas: false,
    allowSolvents: false,
    allowMixtures: true,
    allowMaterials: true,
    id: 'ingredients',
    defaultValue: "",
    onChange: function(value){}
}