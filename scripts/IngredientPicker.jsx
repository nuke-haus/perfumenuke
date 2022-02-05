class IngredientPicker extends React.Component {

    constructor(props) {
        super(props);
    }

    _getDefaultValue() { // convert an ID to a display name
        const material = PN.getMaterial(this.props.defaultValue);
        const mix = PN.getMixture(this.props.defaultValue);
        if (mix != null && material != null) {
            console.error("Found a mixture and material with matching IDs: " + this.props.defaultValue);
        }
        console.log(material, mix, this.props.defaultValue)
        if (mix != null) {
            if (mix.diluted_material != null) {
                console.log(mix.name + PN.getDilutionPercentString(mix))
                return mix.name + PN.getDilutionPercentString(mix);
            } else {
                console.log(mix.name)
                return mix.name;
            }
        } else if (material != null) {
            if (material.is_natural && material.country != null) {
                return `${material.name} from ${material.country}`;
            }
            console.log(material.name)
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
                if (material.is_natural && material.country != null) {
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
                    this._nameMap[mix.name] = mix.id;
                    elements.push(<option key={"mixture" + count} value={mix.name}/>);
                }   
            }
        }
        if (this.props.allowFormulas) {
            for (let id of PN.getAllSortedFormulaIDs()) {
                const formula = PN.getFormula(id);
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
    allowFormulas: false,
    allowSolvents: false,
    allowMixtures: true,
    allowMaterials: true,
    id: 'ingredients',
    defaultValue: "",
    onChange: function(value){}
}