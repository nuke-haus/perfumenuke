class AnalysisBody extends React.Component {

    state = {
        selectedTags: [],
        allTags: [],
        filterAll: true
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
                ? "tag clickabletag selectedtag"
                : "tag clickabletag";
            const text = isSelected
                ? "🟢 " + tag
                : "⚫ " + tag;
            tagElements.push(
                <div className={className} 
                     onClick={() => this._onClickTag(tag)} 
                     key={"filterTag" + tag}>
                         {text}
                </div>
            );
        }

        const tableElements = [];
        const materials = PN.getMaterialsAndMixturesWithTags(this.state.selectedTags, this.state.filterAll);
        for (let material of materials) {
            tableElements.push(
                <tr key={"tableElement" + material.id}>
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
                    INGREDIENT FILTER SETTINGS
                </div>
                <table className="ingredienttable">
                    <tbody>
                        <tr>
                            <td>
                                <div>
                                    FILTER MODE:
                                </div>
                                <div>
                                    <select className="tagfilter" defaultValue={String(PN.database.currentMixture.is_natural)}
                                            onChange={(event) => this.setState({filterAll: event.target.value === "all"})}>
                                        <option value="all">INGREDIENT CONTAINS ALL SELECTED TAGS</option>
                                        <option value="any">INGREDIENT CONTAINS ANY OF THE SELECTED TAGS</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="tagcontainer">
                                {tagElements}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="tabletext">
                    FILTERED INGREDIENTS
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