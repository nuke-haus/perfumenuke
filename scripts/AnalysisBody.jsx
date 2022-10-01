class AnalysisBody extends React.Component {

    state = {
        selectedTags: [],
        allTags: []
    };

    constructor(props) {
        super(props);

        this.state.allTags = PN.getAllUniqueTags();
    }

    _onClickTag(tag) {
        const currentTags = this.state.selectedTags;
        if (currentTags.includes(tag)) {
            this.setState({selectedTags: currentTags.filter(element => element !== tag)});
        } else {
            currentTags.push(tag);
            this.setState({selectedTags: currentTags});
        }
    }

    render() {
        const tagElements = [];
        for (let tag of this.state.allTags) {
            const isSelected = this.state.selectedTags.includes(tag);
            const className = isSelected
                ? "tag clickableTag selectedTag"
                : "tag clickableTag";
            tagElements.push(
                <div className={className} onClick={() => this._onClickTag(tag)}>{tag}</div>
            );
        }

        const tableElements = [];
        const materials = PN.getMaterialsAndMixturesWithTags(this.state.selectedTags);
        for (let material of materials) {
            tableElements.push(
                <tr>
                    <td>{material.name || "NO NAME"}</td>
                    <td>{material.note || "TOP"}</td>
                    <td>{material.longevity || 1}</td>
                    <td>{material.impact || 100}</td>
                    <td>{material.scent || ""}</td>
                </tr>
            );
        }

        return (
            <div>
                <div className="tabletext">
                    INGREDIENT TAGS
                </div>
                <table className="ingredienttable">
                    <tbody>
                        <tr>
                            <td>
                                {tagElements}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    INGREDIENTS CONTAINING SELECTED TAGS
                </div>
                <table className="formulatable">
                    <tbody>
                        <tr>
                            <th>INGREDIENT NAME</th>
                            <th>NOTE TYPE</th>
                            <th>LONGEVITY</th>
                            <th>IMPACT</th>
                            <th>SCENT</th>
                        </tr>
                        {tableElements}
                    </tbody>
                </table>
            </div>
        );
    }
}