/**
 * SQLite 收藏数据库工具
 * 使用 plus.sqlite（仅 App 环境），开发时降级为 Storage
 */

const DB_NAME = 'twdownloader';
const TABLE_NAME = 'favorites';

// ===== 判断运行环境 =====
function isApp() {
	// #ifdef APP-PLUS
	return true;
	// #endif
	return false;
}

// ===== 打开数据库 =====
function openDB() {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			resolve(null);
			return;
		}
		plus.sqlite.openDatabase({
			name: DB_NAME,
			path: `_doc/${DB_NAME}.db`,
			success(db) {
				resolve(db);
			},
			fail(e) {
				reject(e);
			},
		});
	});
}

// ===== 初始化表 =====
function initTable(db) {
	return new Promise((resolve, reject) => {
		if (!db) {
			resolve();
			return;
		}
		db.executeSql({
			sql: `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
				id TEXT PRIMARY KEY,
				title TEXT,
				url TEXT,
				thumbnail TEXT,
				source TEXT DEFAULT 'waterfall',
				extra TEXT,
				liked_at INTEGER
			)`,
			success() { resolve(); },
			fail(e) { reject(e); },
		});
	});
}

// ===== Storage 降级方案 =====
function storageGetAll() {
	try {
		return JSON.parse(uni.getStorageSync('favorites_list') || '[]');
	} catch (e) {
		return [];
	}
}
function storageSaveAll(list) {
	uni.setStorageSync('favorites_list', JSON.stringify(list));
}

// ===== 公开 API =====

/** 初始化数据库（在 App.vue onLaunch 中调用） */
export function initDatabase() {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			resolve();
			return;
		}
		openDB().then(db => {
			initTable(db).then(() => {
				db.close();
				resolve();
			}).catch(reject);
		}).catch(reject);
	});
}

/** 获取所有收藏 */
export function getFavorites() {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			resolve(storageGetAll());
			return;
		}
		openDB().then(db => {
			db.selectSql({
				sql: `SELECT * FROM ${TABLE_NAME} ORDER BY liked_at DESC`,
				success(res) {
					db.close();
					const list = (res || []).map(row => ({
						id: row.id,
						title: row.title,
						url: row.url,
						thumbnail: row.thumbnail,
						source: row.source,
						extra: row.extra ? JSON.parse(row.extra) : {},
						likedAt: row.liked_at,
					}));
					resolve(list);
				},
				fail(e) {
					db.close();
					reject(e);
				},
			});
		}).catch(reject);
	});
}

/** 收藏一个视频 */
export function addFavorite(item) {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			const list = storageGetAll();
			const idx = list.findIndex(f => f.id === item.id);
			if (idx >= 0) {
				list[idx] = { ...item, likedAt: Date.now() };
			} else {
				list.unshift({ ...item, likedAt: Date.now() });
			}
			storageSaveAll(list);
			resolve();
			return;
		}
		openDB().then(db => {
			db.executeSql({
				sql: `INSERT OR REPLACE INTO ${TABLE_NAME} (id, title, url, thumbnail, source, extra, liked_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
				args: [
					item.id,
					item.title || '',
					item.url || '',
					item.thumbnail || '',
					item.source || 'waterfall',
					JSON.stringify(item.extra || {}),
					Date.now(),
				],
				success() {
					db.close();
					resolve();
				},
				fail(e) {
					db.close();
					reject(e);
				},
			});
		}).catch(reject);
	});
}

/** 取消收藏 */
export function removeFavorite(id) {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			const list = storageGetAll().filter(f => f.id !== id);
			storageSaveAll(list);
			resolve();
			return;
		}
		openDB().then(db => {
			db.executeSql({
				sql: `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
				args: [id],
				success() {
					db.close();
					resolve();
				},
				fail(e) {
					db.close();
					reject(e);
				},
			});
		}).catch(reject);
	});
}

/** 检查某个视频是否已收藏 */
export function isFavorited(id) {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			const list = storageGetAll();
			resolve(list.some(f => f.id === id));
			return;
		}
		openDB().then(db => {
			db.selectSql({
				sql: `SELECT COUNT(*) as cnt FROM ${TABLE_NAME} WHERE id = ?`,
				args: [id],
				success(res) {
					db.close();
					resolve(res && res[0] && res[0].cnt > 0);
				},
				fail(e) {
					db.close();
					reject(e);
				},
			});
		}).catch(reject);
	});
}

/** 同步 favorite 的 ID 集合（返回 Set<string>） */
export function getFavoriteIds() {
	return new Promise((resolve, reject) => {
		if (!isApp()) {
			const list = storageGetAll();
			resolve(new Set(list.map(f => f.id)));
			return;
		}
		openDB().then(db => {
			db.selectSql({
				sql: `SELECT id FROM ${TABLE_NAME}`,
				success(res) {
					db.close();
					resolve(new Set((res || []).map(r => r.id)));
				},
				fail(e) {
					db.close();
					reject(e);
				},
			});
		}).catch(reject);
	});
}
