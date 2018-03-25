/***********************************
*
* DNDList
*
***********************************/
require("./DNDList.sass")
const ListItem = require('../ListItem/ListItem')

module.exports = _v => {
	let current = null
	let dnd = { drag: null, drop: null }

	const dndClass = (dnd, item) => {
		const classes = []
		if (item === dnd.drag) classes.push('dragging')
		if (item === dnd.drop) classes.push('dropping')
		if (item === current) classes.push('current')
		return classes.join(' ')
	}
		

	const dragAttrs = (key, array) => ({
		key: key,
		class: dndClass(dnd, key),
		ondragstart: () => { dnd.drag = key },
		ondragover: () => { if (dnd.drag && array.indexOf(key) > -1) dnd.drop = key },
		ondragend: () => { dnd = { drag: null, drop: null } }
	})

	const dragover = e => { e.preventDefault() }
	const drop = (array, saveChanges) => e => {
		e.stopPropagation()
		const draggedIdx = array.indexOf(dnd.drag)
		const droppedIdx = array.indexOf(dnd.drop)

		const insertionIdx = draggedIdx < droppedIdx ? droppedIdx + 1 : droppedIdx
		const deletionIdx = draggedIdx > droppedIdx ? draggedIdx + 1 : draggedIdx

		if (insertionIdx !== deletionIdx) {
			// your custom  code for updating the list goes here.
			array.splice(insertionIdx, 0, dnd.drag)
			array.splice(deletionIdx, 1)

			saveChanges()
		}
		dnd = { drag: null, drop: null }
	}
	
	return {
		view: ({attrs : { header, addFn, array, saveFn, clickFn, titleSaveFn, removeFn }}) =>
			m('menu.flex.col.m0.p0.br1-black',
				m('.menu-header.flex.ac.bg-dark.c-white.h50.ph10',
					m('h3.mra', header),
					m('button.add-button.font-24', { onclick: addFn }, '⊕')
				),
				//
				// m('h3.menu-header', header, m('button.add', { onclick: addFn }, '⊕')),
				m('.list.f1.bg-light.oya',
					{
						ondragover: dragover,
						ondrop: drop(array, saveFn)
					},
					array && array.map((o, idx) =>
						m('.drag-item[draggable]',
							dragAttrs(o.id, array),
							m(ListItem,
								{
									collectionName: header.toLowerCase(),
									obj: o,
									key: o.id,
									idx: idx,
									onclick: clickFn,
									remove: removeFn,
								}
							)
						)
					)
				)
			)
	}
} 


/* 

header: string in header
addFn: function for adding a thing
array: items array
saveFn: save after drop
object: object that has the roadmap
clickFn: click to select the list item
titleSaveFn: method for saving the title
removeFn: method for removing the item
 
*/