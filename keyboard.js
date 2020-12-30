document.onkeydown = function (e) {
    if(e.ctrlKey) {
        switch(e.code) {
            case 'KeyH':
                e.preventDefault()
                document.querySelector('.CodeMirror').classList.toggle('hidden')
                break;
            case 'KeyS':
                e.preventDefault()
                sketchName = prompt(`current sketch: ${sketchName}\n\nnew sketch name:`)
                if(!sketchName) return
                localStorage.setItem(sketchKey(sketchName), editor.getDoc().getValue())
                break;
            case 'KeyO':
                e.preventDefault()
                let sketches = Object.keys(localStorage)
                                .filter(n => n.startsWith("thixels:sketch:") && !n.endsWith(sketchName))
                                .map(n => n.replace("thixels:sketch:", ""))
                                .join(", ")
                sketchName = prompt(`current sketch: ${sketchName}\n\noptions:\n${sketches}\n\nsketch name`)
                if(!sketchName) return
                let source = localStorage.getItem(sketchKey(sketchName))
                if(source) {
                    editor.setValue(source)
                } else {
                    alert(`sketch '${sketchName}' not found`)
                }
                break;
        }
    }
}