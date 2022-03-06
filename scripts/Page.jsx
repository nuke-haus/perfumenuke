class Page extends React.Component {

    NAV_FORMULA = "FORMULA";
    NAV_DATABASE = "DATABASE";
    NAV_ERRORS = "ERRORS"

    state = {
        currentNav: "FORMULA"
    };

    constructor(props) {
        super(props);

        // Load data in order since there's dependencies (materials -> mixtures -> formulas)
        fetch('data/materials.json')
            .then(response => response.json())
            .then(data => this._onLoadMaterials(data));
    }

    _onLoadMaterials(data) {
        PN.validateLoadedMaterials(JSON.parse(localStorage.getItem('perfume_nuke_data')) ? JSON.parse(localStorage.getItem('perfume_nuke_data')).materials : data.materials); //Optional chaining and nullish coercion would be better here

        fetch('data/mixtures.json')
            .then(response => response.json())
            .then(data => this._onLoadMixtures(data));
    }

    _onLoadMixtures(data) {
        PN.validateLoadedMixtures(JSON.parse(localStorage.getItem('perfume_nuke_data')) ? JSON.parse(localStorage.getItem('perfume_nuke_data')).mixtures : data.mixtures); //Optional chaining and nullish coercion would be better here

        fetch('data/formulas.json')
            .then(response => response.json())
            .then(data => this._onLoadFormulas(data));
    }

    _onLoadFormulas(data) {
        PN.validateLoadedFormulas(JSON.parse(localStorage.getItem('perfume_nuke_data')) ? JSON.parse(localStorage.getItem('perfume_nuke_data')).formulas : data.formulas); //Optional chaining and nullish coercion would be better here
        this.forceUpdate();
    }

    _getClassName(tabName) {
        return (this.state.currentNav === tabName) 
            ? "selectednav"
            : "";
    }

    _onNavClick(id) {
        this.setState({currentNav: id});
    }

    render() {
        let errorsTab = null;
        let errors = null;
        let warnings = null;
        let table = null;
        if (PN.warnings.length > 0 || PN.errors.length > 0) {
            errorsTab = (
                <div className="topbutton error" onClick={() => this._onNavClick(this.NAV_ERRORS)}>
                    <span className={this._getClassName(this.NAV_ERRORS)}>{this.NAV_ERRORS}</span>
                </div>
            );
            
            let count = 0;
            errors = [];
            warnings = [];
            for (let warning of PN.warnings) {
                count = count + 1;
                warnings.push(
                    <tr key={"warning" + count}>
                        <td>
                            <span className="warning tablecontent">WARNING</span>
                        </td>
                        <td>
                            <div className="tablecontent">
                                {warning}
                            </div>
                        </td>
                    </tr>
                );
            }
            for (let error of PN.errors) {
                count = count + 1;
                errors.push(
                    <tr key={"error" + count}>
                        <td>
                            <span className="error tablecontent">ERROR</span>
                        </td>
                        <td>
                            <div className="tablecontent">
                                {error}
                            </div>
                        </td>
                    </tr>
                );
            }
            table = (
                <table className="errortable">
                    <tbody>
                        {errors}
                        {warnings}
                    </tbody>
                </table>
            );
        }

        const header = (
            <div>
                <div className="navbar">
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_FORMULA)}>
                        <span className={this._getClassName(this.NAV_FORMULA)}>{this.NAV_FORMULA}</span>
                    </div>
                    <div className="topbutton" onClick={() => this._onNavClick(this.NAV_DATABASE)}>
                        <span className={this._getClassName(this.NAV_DATABASE)}>{this.NAV_DATABASE}</span>
                    </div>
                    {errorsTab}
                </div>
                <div className="bar">
                </div>
                <div className="barshadow">
                </div>
            </div>
        );

        if (this.state.currentNav == this.NAV_FORMULA) { 

            return (<div>
                {header}
                <FormulaBody/>
            </div>);

        } else if (this.state.currentNav == this.NAV_DATABASE) { 

            return (<div>
                {header}
                <DatabaseBody/>
            </div>);

        } else if (this.state.currentNav == this.NAV_ERRORS) { 

            return (<div>
                {header}
                {table}
            </div>);

        } 

        return null;
    }
}