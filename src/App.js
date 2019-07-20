import React from 'react';
import ReactShakaPlayer from './react-shakaplayer';
import './App.css';
window.goog = {};
window.shaka = {};
function App() {
	return (
		<div className='App'>
			<ReactShakaPlayer />
		</div>
	);
}

export default App;
