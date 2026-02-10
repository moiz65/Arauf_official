import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(() => {
		try {
			const raw = localStorage.getItem('currentUser');
			return raw ? JSON.parse(raw) : null;
		} catch {
			return null;
		}
	});

	// Keep context in sync if other tabs change localStorage
	useEffect(() => {
		const onStorage = (e) => {
			if (e.key === 'currentUser') {
				try {
					setUser(e.newValue ? JSON.parse(e.newValue) : null);
				} catch {
					setUser(null);
				}
			}
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);

	const login = (userObj) => {
		try {
			localStorage.setItem('currentUser', JSON.stringify(userObj));
			setUser(userObj);
		} catch (err) {
			console.error('Failed to persist user', err);
		}
	};

	const logout = () => {
		try {
			localStorage.removeItem('currentUser');
		} catch (err) {
			console.error('Failed to remove user', err);
		}
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};

export default AuthContext;
