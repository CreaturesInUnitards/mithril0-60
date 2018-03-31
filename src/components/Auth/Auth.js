/***********************************
*
* Auth
*
***********************************/
require("./Auth.sass")

module.exports = _v => {
	const creds = { email: '', password: '' }
	let tries = 0
	let trying = false
	
	const signIn = () => {
		firebase.auth().signInWithEmailAndPassword(creds.email, creds.password)
			.then(_data => { trying = false; m.route.set('/dashboard') })
			.catch(_e => {
				Object.assign(creds, { email: '', password: '' })
				document.querySelector('[type=email]').focus()
				trying = false
				m.redraw()
			})
	}
	
	const handleKeyDown = e => {
		if (e.which === 13) {
			tries++
			trying = true
			signIn()
		}
	}
	
	return {
		view: () =>
			m('.auth',
				m('.login',
					{ onkeydown: handleKeyDown },
					m('input[type=email][placeholder=email][autofocus]',
						{ 
							class: (creds.email === '' && tries > 0) ? 'error' : '',
							value: creds.email, 
							oninput: m.withAttr('value', v => creds.email = v) 
						}
					),
					m('input[type=password][placeholder=password]',
						{ 
							class: (creds.password === '' && tries > 0) ? 'error' : '',
							value: creds.password, 
							oninput: m.withAttr('value', v => creds.password = v) 
						}
					),
					m('', m('button.login-button', { onclick: _e => { Object.assign(creds, { email: 'portrayme@mac.com', password: 'passw0rd' }); signIn() } }, 'log in as portrayme')),
					m('', m('button.login-button', { onclick: _e => { Object.assign(creds, { email: 'foo@foo.net', password: 'passw0rd' }); signIn() } }, 'log in as foo')),
					trying && m('i', 'logging in...')
				)
			)
	}
}

// TODO: strip out the auto-logins :D
