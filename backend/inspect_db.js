const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./dev.sqlite');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
    if (err) {
      console.error(err);
      db.close();
      return;
    }
    console.log('TABLES=' + JSON.stringify(rows));
    db.all("SELECT id, email, nombre, activo, roles, permissions FROM Usuarios", (err2, rows2) => {
      if (err2) {
        console.error(err2);
        db.close();
        return;
      }
      console.log('USERS=' + JSON.stringify(rows2, null, 2));
      db.close();
    });
  });
});
