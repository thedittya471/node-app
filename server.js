const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = process.env.PORT || 3000;
const PAGES = path.join(__dirname, 'pages');
const PUBLIC = path.join(__dirname, 'public');

const mime = {
	'.html': 'text/html',
	'.css': 'text/css',
	'.js': 'application/javascript',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
};

async function sendFile(res, filePath, status = 200) {
	try {
		const full = path.normalize(filePath);
		const data = await fs.readFile(full);
		const ext = path.extname(full).toLowerCase();
		res.writeHead(status, { 'Content-Type': mime[ext] || 'application/octet-stream' });
		res.end(data);
	} catch (err) {
		if (err.code === 'ENOENT') {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			return res.end('404 - Not found');
		}
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('500 - Server error');
	}
}

const routes = {
	'/home': 'home.html',
	'/about': 'about.html',
	'/contact': 'contact.html',
	'/services': 'services.html', // extra
};

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, `http://${req.headers.host}`);
		const pathname = url.pathname;

		// redirect root to /home
		if (pathname === '/') {
			res.writeHead(302, { Location: '/home' });
			return res.end();
		}

		// serve public files: /public/style.css etc.
		if (pathname.startsWith('/public/')) {
			const rel = pathname.replace('/public/', '');
			const file = path.join(PUBLIC, rel);
			return await sendFile(res, file, 200);
		}

		// route pages
		if (routes[pathname]) {
			const file = path.join(PAGES, routes[pathname]);
			return await sendFile(res, file, 200);
		}

		// not found -> custom 404 page
		return await sendFile(res, path.join(PAGES, '404.html'), 404);
	} catch (err) {
		console.error('Request error', err);
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('500 - Server error');
	}
});

server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
