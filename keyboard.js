function uninterestingToken(type) {
    return type == null || type == 'bracket'
}

function getInterestingTokenAt(pos) {
    let token = editor.getTokenAt(pos)
    if (uninterestingToken(token.type))
        token = editor.getTokenAt({ line: pos.line, ch: pos.ch + 1 })    
    return token   
}

function selectionOrWord() {
    const doc = editor.getDoc()
    if (doc.somethingSelected()) {
        return doc.getSelection()
    } else {
        let token = getInterestingTokenAt(doc.getCursor())
        return token.string
    }
}

editor.setOption('extraKeys', {
    "Shift-Ctrl-L": function () {
        let query = selectionOrWord()
        let cursor = editor.getSearchCursor(query)
        let sels = []
        while (cursor.findNext()) {
            sels.push({ anchor: cursor.from(), head: cursor.to() })
        }
        editor.getDoc().setSelections(sels)
    },
    "Ctrl-D": function () {
        const doc = editor.getDoc()
        if(doc.somethingSelected()) {
            // expand selection to next match
            const sels = doc.listSelections()
            const selTexts = doc.getSelections() 
            const sel = sels[sels.length - 1]
            const selText = selTexts[selTexts.length - 1]
            let cursor = editor.getSearchCursor(selText, sel.head)
            if(cursor.findNext()) {
                sels.push({ anchor: cursor.from(), head: cursor.to() })
            }
            editor.getDoc().setSelections(sels, sels.length - 1)

        } else {
            // expand all cursors to words
            const sels = editor.getDoc().listSelections().map(sel => {
                let token = getInterestingTokenAt(sel.head)
                let anchor = { line: sel.anchor.line, ch: token.start }
                let head = { line: sel.head.line, ch: token.end }
                return { anchor, head }
            })
            editor.getDoc().setSelections(sels)
        }

    },
    "Shift-Ctrl-Up": function () {
        const sels = editor.getDoc().listSelections()
        const sel = sels[0]
        let anchor = { line: sel.anchor.line - 1, ch: sel.anchor.ch }
        let head = { line: sel.head.line - 1, ch: sel.head.ch }
        sels.push({ anchor, head })
        editor.getDoc().setSelections(sels)
    },
    "Shift-Ctrl-Down": function () {
        const sels = editor.getDoc().listSelections()
        const sel = sels[sels.length - 1]
        let anchor = { line: sel.anchor.line + 1, ch: sel.anchor.ch }
        let head = { line: sel.head.line + 1, ch: sel.head.ch }
        sels.push({ anchor, head })
        editor.getDoc().setSelections(sels, sels.length - 1)
    }
})

document.onkeydown = function (e) {
    if (e.ctrlKey) {
        switch (e.code) {
            case 'KeyH':
                e.preventDefault()
                const classes = document.querySelector('.CodeMirror').classList
                classes.toggle('hidden')
                if(classes.contains('hidden'))
                    editor.display.input.blur()
                else
                editor.display.input.focus()
                break;
            case 'KeyS':
                e.preventDefault()
                sketchName = prompt(`current sketch: ${sketchName}\n\nnew sketch name:`)
                if (!sketchName) return
                localStorage.setItem(sketchKey(sketchName), editor.getDoc().getValue())
                break;
            case 'KeyO':
                e.preventDefault()
                let sketches = Object.keys(localStorage)
                    .filter(n => n.startsWith("thixels:sketch:") && !n.endsWith(sketchName))
                    .map(n => n.replace("thixels:sketch:", ""))
                    .join(", ")
                sketchName = prompt(`current sketch: ${sketchName}\n\noptions:\n${sketches}\n\nsketch name`)
                if (!sketchName) return
                let source = localStorage.getItem(sketchKey(sketchName))
                if (source) {
                    editor.setValue(source)
                } else {
                    alert(`sketch '${sketchName}' not found`)
                }
                break;
        }
    }
}