class Page extends React.Component {

    NAV_FORMULA = "FORMULA";
    NAV_DATABASE = "DATABASE";
    NAV_ERRORS = "ERRORS"

    state = {
        currentNav: "FORMULA"
    };

    _onNavClick(id) {
        this.setState({currentNav: id});
    }

    _onLoadMaterials(data) {
        PN.validateLoadedMaterials(data.materials);

        // Fetch mixtures only after materials are loaded since there's a dependancy
        fetch('data/mixtures.json')
            .then(response => response.json())
            .then(data => this._onLoadMixtures(data));
    }

    _onLoadMixtures(data) {
        PN.validateLoadedMixtures(data.mixtures);
        this.forceUpdate();
    }

    constructor(props) {
        super(props);

        fetch('data/materials.json')
            .then(response => response.json())
            .then(data => this._onLoadMaterials(data));
    }

    _getClassName(tabName) {
        return (this.state.currentNav === tabName) 
            ? "selectednav"
            : "";
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