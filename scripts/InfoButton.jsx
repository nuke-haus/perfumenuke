class InfoButton extends React.Component {

    state = {
        showModal: false
    }

    constructor(props) {
        super(props);
    }

    _onClick(show) {
        this.setState({showModal: show});
    }

    _renderDiv(text) {
        return (
            <div className="modalrow">
                {text}
            </div>
        );
    }

    _renderModal() {
        if (this.state.showModal) {
            const country = (this.props.material.country != null)
                ? this._renderDiv("COUNTRY OF ORIGIN: " + this.props.material.country)
                : null;
            const company = (this.props.material.company != null)
                ? this._renderDiv("COMPANY: " + this.props.material.company)
                : null;
            const scent = (this.props.material.scent != null)
                ? this._renderDiv("SCENT: " + this.props.material.scent)
                : null;
            const usage = (this.props.material.usage != null)
                ? this._renderDiv("USAGE: " + this.props.material.usage)
                : null;
            const note = (this.props.material.note != null)
                ? this._renderDiv("NOTE: " + this.props.material.note)
                : null;
            const longevity = (this.props.material.longevity != null)
                ? this._renderDiv("LONGEVITY (HOURS): " + this.props.material.longevity)
                : null;
            const impact = (this.props.material.impact != null)
                ? this._renderDiv("IMPACT: " + this.props.material.impact)
                : null;
            const dilute = (this.props.material.dilute != null)
                ? this._renderDiv("RECOMMENDED DILUTION: " + this.props.material.dilute)
                : null;
            const cas = (this.props.material.cas != null)
                ? this._renderDiv("CAS NUMBER: " + this.props.material.cas)
                : null;

            return (
                <div className="modal">
                    {country}
                    {company}
                    {scent}
                    {usage}
                    {note}
                    {longevity}
                    {impact}
                    {dilute}
                    {cas}
                </div>
            );
        }
        return null;
    }

    render() {
        const modalback = this.state.showModal
            ? (<div className="modalback" onClick={() => this._onClick(false)}/>)
            : null;

        return (
            <div className="infobutton">
                <span className="modalbutton" onClick={() => this._onClick(true)}>
                    {"\u{1F4C3}"}
                </span>
                <span>
                    {this.props.material.name || "???"}
                </span>
                {this._renderModal()}
                {modalback}
            </div>
        );
    }
}

InfoButton.defaultProps = {
    material: {}
}