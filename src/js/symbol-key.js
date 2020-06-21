import * as molSetSvg from "../imgs/key-svg/molecule-set.svg";
import * as smallMolSvg from "../imgs/key-svg/small-molecule.svg";
import * as geneSvg from "../imgs/key-svg/gene.svg";
import * as dnaSvg from "../imgs/key-svg/dna.svg";
import * as rnaSvg from "../imgs/key-svg/rna.svg";
import * as proteinCircleSvg from "../imgs/key-svg/protein-circle.svg";
import * as proteinBarSvg from "../imgs/key-svg/protein-bar.svg";

export function SymbolKey (symbolKeyDiv) {
    const symbols = [
        molSetSvg,
        smallMolSvg,
        geneSvg,
        dnaSvg,
        rnaSvg,
        proteinCircleSvg,
        proteinBarSvg
    ];
    const names = [
        "Molecule Set",
        "Bioactive Entity",
        "Gene",
        "DNA",
        "RNA",
        "Protein (residues hidden)",
        "Protein (residues shown)"
    ];

    if (typeof symbolKeyDiv === "string") {
        this.el = document.getElementById(symbolKeyDiv);
    } else {
        this.el = symbolKeyDiv;
    }

    const table = document.createElement("table");
    table.setAttribute("class", "symbol_key");
    for (let i = 0; i < symbols.length - 2; i++) {
        const tr = document.createElement("tr");
        const htmlTableRowElement = table.appendChild(tr);
        // const td1 = document.createElement("td");
        // let img = document.createElement("img");
        // td1.appendChild(symbols[i]);

    }
    let img = document.createElement("img");
    // img.style = {
    //     height: '25%',
    //     width: '25'
    // };


    img.src = molSetSvg.default;
    console.log("imported", molSetSvg);

    this.el.appendChild(img);

}


//     <!--                                    <img alt="Molecule Set" src="./imgs/key-svg/molecule-set.svg">-->
// <!--                                    <img alt="Bioactive Entity" src="./imgs/key-svg/small-molecule.svg">-->
// <!--                                    <img alt="Gene" src="./imgs/key-svg/gene.svg">-->
// <!--                                    <img alt="DNA" src="./imgs/key-svg/dna.svg">-->
// <!--                                    <img alt="RNA" src="./imgs/key-svg/rna.svg">-->
// <!--                                </div>-->
// <!--                            </td>-->
// <!--                            <td>RNA</td>-->
// <!--                        </tr>-->
// <!--                        <tr style="border: 1px grey;">-->
// <!--                            <td>-->
// <!--                                <div style="float:right">-->
// <!--                                    <img alt="Protein" src="./imgs/key-svg/protein-circle.svg">-->
// <!--                                </div>-->
// <!--                                <div style="float:right">-->
// <!--                                    <img alt="Protein" src="./imgs/key-svg/protein-bar.svg">-->
// <!--                                </div>-->
// <!--                            </td>-->
// <!--                            <td>Protein - click to toggle between circle and bar</td>-->