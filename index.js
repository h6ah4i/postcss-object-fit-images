'use strict'

const postcss = require('postcss')
const parseCssFont = require('parse-css-font')
const quote = require('quote')

const quoteIfNecessary = function (family) {
    if (/[^^]\s[^$]/.test(family)) {
        return quote(family)
    }
    return family
}

const getLastPropertyDecl = function (parent, name) {
    let decl = null

    parent.walkDecls(name, currentDecl => {
        decl = currentDecl
    })

    return decl
}

const declWalker = function (decl) {
    let parent = decl.parent

    let objFit = decl.value

    let existingFont = getLastPropertyDecl(parent, /^font(-family)?$/)
    let objPosition = getLastPropertyDecl(parent, 'object-position')

    let value = ['object-fit:' + objFit]
    if (objPosition) {
        value.push('object-position:' + objPosition.value)
    }

    let props = {
        prop: 'font-family',
        value: quote(value.join(';'))
    }

    // keep existing font-family
    let fontFamily = null
    if (existingFont) {
        if (existingFont.prop === 'font') {
            fontFamily = parseCssFont(existingFont.value).family
            fontFamily = fontFamily.map(quoteIfNecessary).join(', ')
        } else {
            fontFamily = existingFont.value
        }
    }
    if (fontFamily) {
        props.value += ', ' + fontFamily

        if (existingFont.prop === 'font') {
            existingFont.cloneAfter(props)
        } else {
            existingFont.replaceWith(props)
        }
    } else {
        decl.cloneBefore(props)
    }
}

// eslint-disable-next-line no-unused-vars
module.exports = postcss.plugin('postcss-object-fit-images', opts => {
    return function (css) {
        css.walkDecls('object-fit', declWalker)
    }
})
