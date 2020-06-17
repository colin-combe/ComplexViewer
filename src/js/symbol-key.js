import * as molSetSvg from '../imgs/key-svg/molecule-set.svg';

export default function SymbolKey (symbolKeyDiv) {
    if (typeof symbolKeyDiv === 'string') {
        this.el = document.getElementById(symbolKeyDiv);
    } else {
        this.el = symbolKeyDiv;
    }

    let img = document.createElement('img');
    // img.style = {
    //     height: '25%',
    //     width: '25'
    // };


    img.src = molSetSvg.default;
    console.log('imported', molSetSvg);

    this.el.appendChild(img);

}
