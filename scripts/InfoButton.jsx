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

    _renderModal() {
        if (this.state.showModal) {
            return (
                <div className="modal">
                    <div className="modalrow">
                        {"SCENT: " + this.props.material.scent}
                    </div>
                    <div className="modalrow">
                        {"USAGE: " + this.props.material.usage}
                    </div>
                    <div className="modalrow">
                        {"NOTE: " + this.props.material.note}
                    </div>
                    <div className="modalrow">
                        {"LONGEVITY (HOURS): " + (this.props.material.longevity || "???")}
                    </div>
                    <div className="modalrow">
                        {"IMPACT: " + (this.props.material.impact + "???")}
                    </div>
                    <div className="modalrow">
                        {"CAS NUMBER: " + this.props.material.cas}
                    </div>
                    <button type="button" 
                            className="modalclose"
                            onClick={() => this._onClick(false)}>
                        Close
                    </button>
                </div>
            );
        }
        return null;
    }

    render() {
        return (
            <div className="infobutton">
                <span>
                    {this.props.material.name || "???"}
                </span>
                <span className="modalbutton" onClick={() => this._onClick(true)}>
                    {"\u{1F4DC}"}
                </span>
                {this._renderModal()}
            </div>
        );
    }
}

InfoButton.defaultProps = {
    material: {}
}