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

paredit.specialForms.push('forl')

function applyPareditChanges(source, changes) {
    for (const [verb, index, x] of changes) {
        if(verb === 'remove') {
            source = source.slice(0, index) + source.slice(index + x)
        } else if(verb === 'insert') {
            source = source.slice(0, index) + x + source.slice(index)
        }
    }
    return source
}

function doPareditNavigate(f) {
    const doc = editor.getDoc()
    const ast = paredit.parse(doc.getValue())
    const cursor = doc.getCursor()
    const idx = doc.indexFromPos(cursor)
    const newIndex = f(ast, idx)
    doc.setCursor(doc.posFromIndex(newIndex))
}

function doPareditEdit(f) {
    const doc = editor.getDoc()
    const scrollPosition = editor.getScrollInfo()
    const source = doc.getValue()
    const ast = paredit.parse(source)
    const cursor = doc.getCursor()
    const idx = doc.indexFromPos(cursor)
    const edit = f(ast, source, idx)
    if(edit) {
        const { newIndex, changes } = edit
        const newSource = applyPareditChanges(source, changes)
        doc.setValue(newSource)
        doc.setCursor(doc.posFromIndex(newIndex))
        editor.scrollTo(scrollPosition.left, scrollPosition.top)
    }
}

function insertAndAutoClose(pair) {
    const doc = editor.getDoc()
    doc.replaceSelection(pair)
    const {line,ch} = doc.getCursor()
    doc.setCursor({line,ch:ch-1})
}

editor.setOption('extraKeys', {
    // better autoclose
    'Shift-9': function() {
        insertAndAutoClose("()")
    },
    '[': function() {
        insertAndAutoClose("[]")
    },
    'Shift-[': function() {
        insertAndAutoClose("{}")
    },
    // navigate upward sexp
    'Alt-Up': function() {
        doPareditNavigate(paredit.navigator.backwardUpSexp)
    },
    // navigate downward sexp
    'Alt-Down': function() {
        doPareditNavigate(paredit.navigator.forwardDownSexp)
    },
    // navigate forward sexp
    'Alt-Right': function() {
        doPareditNavigate(paredit.navigator.forwardSexp)
    },
    // navigate backward sexp
    'Alt-Left': function() {
        doPareditNavigate(paredit.navigator.backwardSexp)
    },
    // kill forwards
    'Alt-Delete': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.killSexp(ast, source, idx, {}))
    },
    // kill backwards
    'Alt-Backspace': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.killSexp(ast, source, idx, {backward:true}))
    },
    // wrap { }
    'Shift-Alt-[': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.wrapAround(ast, source, idx, "{", "}", {}))
    },
    'Alt-[': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.wrapAround(ast, source, idx, "[", "]", {}))
    },
    // wrap ( )
    'Alt-9': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.wrapAround(ast, source, idx, "(", ")", {}))
    },
    'Shift-Alt-9': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.wrapAround(ast, source, idx, "(", ")", {}))
    },
    // slurp sexp
    'Shift-Alt-Right': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.slurpSexp(ast, source, idx, {}))
    },
    'Shift-Alt-Left': function() {
        doPareditEdit((ast, source, idx) =>
            paredit.editor.slurpSexp(ast, source, idx, {backward:true}))
    },
    // split sexp
    'Shift-Alt-Down': function() {
        doPareditEdit(paredit.editor.splitSexp)
    },
    // splice sexp
    'Shift-Alt-Up': function() {
        doPareditEdit(paredit.editor.spliceSexp)
    },
    // format document
    'Shift-Alt-F': function() {
        const doc = editor.getDoc()
        const cursor = doc.getCursor()
        doPareditEdit((ast, source) => paredit.editor.indentRange(ast, source, 0, source.length))
        doc.setCursor(cursor)
    },

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
            const ch = Math.max(sel.head.ch, sel.anchor.ch)
            let cursor = editor.getSearchCursor(selText, { ...sel.head, ch })
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