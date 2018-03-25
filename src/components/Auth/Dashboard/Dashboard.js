/***********************************
*
* Dashboard
*
***********************************/
window.alf = require('../alf')
const FBObserve = require('../FBObserve')
const { AddObject, UpdateObject, RemoveObject } = require('../Operations')
const LoadingAnimation = require('../../LoadingAnimation/LoadingAnimation')
const ChapterEditor = require('../ChapterEditor/ChapterEditor')
const DNDList = require('../DNDList/DNDList')
require("./Dashboard.sass")

const resetAdminData = () => ({
	user: null,
	courses: {},
	chapters: {},
	chapterCache: {}
})
window.AdminData = resetAdminData() 

const signOut = _e => {
	AdminData = resetAdminData()
	firebase.auth().signOut()
	m.route.set('/admin')
}

const setObserver = (collectionName, uid, targetObject, parent, parentCollectionName, AdminDataPropName) => {
	FBObserve(collectionName, targetObject, {
		condition: ['parent', '==', uid],
		callback: change => {
			const docId = change.doc.id
			const docData = change.doc.data()
			const children = parent.data.children || []
			const findFn = c => c.id == docId
			if (change.type != 'modified') {
				if (change.type == 'added') {
					if (!children.find(findFn)) {
						children.push({ id: docId, title: docData.title })
					}
				}
				else if (change.type == 'removed') {
					children.splice(children.indexOf(children.find(findFn)), 1)
				}
				UpdateObject(parentCollectionName, parent.id, { children: children })
				m.redraw()
			}
			if (AdminData[AdminDataPropName] && docId == AdminData[AdminDataPropName].id) {
				AdminData[AdminDataPropName].data = docData
			}
		}
	})
}

const getUser = () => {
	const uid = firebase.auth().currentUser.uid
	firebase.firestore().collection('users').doc(uid).get().then(doc => {
		AdminData.user = { id: doc.id, data: doc.data() }
		m.redraw()
		setObserver('courses', uid, AdminData.courses, AdminData.user, 'users', 'courseCopy')
	})
}

const chooseCourse = courseObj => _e => {
	// TODO: cache courses and chapters
	const courseID = courseObj.id
	if (AdminData.courseCopy && AdminData.courseCopy.id === courseID) return
	AdminData.courseCopy = alf.deepClone(AdminData.courses[courseID])
	AdminData.chapters = {}
	AdminData.chapterCopy = null
	setObserver('chapters', courseID, AdminData.chapters, AdminData.courseCopy, 'courses', 'chapterCopy')
}

const chooseChapter = obj => _e => {
	AdminData.chapterCopy = alf.deepClone(AdminData.chapters[obj.id])
}

const removeCourse = (course, idx) => _e => {
	if (confirm(`Are you sure? "${course.data.title}" will be gone forever, along with all of its chapters and their data. Pretty scary.`)) {
		if (confirm('Last chance...?')) {
			RemoveObject('courses', course.id)
		}
	}
}

const removeChapter = (chapter, idx) => _e => {
	if (confirm(`Are you sure? "${chapter.data.title}" will be gone forever, along with all of its data.`)) {
		if (confirm('Last chance...?')) {
			RemoveObject('chapters', chapter.id)
		}
	}
}

const username = user => `${user.data.first} ${user.data.last}`

module.exports = {
	oninit: getUser,
	view: () => {
		const user = AdminData.user
		const courses = (user && user.data && user.data.children) ? user.data.children : []
		return user
			?   m('.dashboard.flex.col.fullscreen',
				[
					m('header.flex.ac.bg-dark.c-white.pv10.ph20',
						m('img.logo[src=../../../images/blipLogo.svg].mr20'),
						m('h1.mra', `Dashboard: ${username(user)}`),
						m('button.b0.brad4.f-12.bg-white.c-dark', { onclick: signOut }, 'log out')
					),
					m('.main.flex.f1',
						m(DNDList, {
							header: 'Courses',
							addFn: AddObject('courses', { parent: AdminData.user.id, title: 'New Course' }),
							array: courses,
							saveFn: () => { UpdateObject('users', user.id, { children: courses }) },
							clickFn: chooseCourse,
							removeFn: removeCourse
						}),
						AdminData.courseCopy
							? m(DNDList, {
								header: 'Chapters',
								addFn: AddObject('chapters', { parent: AdminData.courseCopy.id, title: 'New Chapter' }),
								array: AdminData.courseCopy.data.children,
								saveFn: () => { UpdateObject('courses', AdminData.courseCopy.id, { children: AdminData.courseCopy.data.children }) },
								clickFn: chooseChapter,
								removeFn: removeChapter
							})
							: m('.no-content.flex.jc.ac.f1', 'Select a course'),
						(AdminData.courseCopy && !AdminData.chapterCopy)
							? m('.no-content.flex.jc.ac.f1', 'Select a chapter')
							: AdminData.chapterCopy && m(ChapterEditor)
					)
				]
			)
			: m(LoadingAnimation)
	}
}