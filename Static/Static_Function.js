function FormaDate(dates) {
  const date = new Date(dates);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  generateString: (length) => {
    const caractere = "123456789ABCDEFGHIJKLMNPRSTUVWXYZ";
    let resultat = "";
    let caractereLength = caractere.length;
    for (let i = 0; i < length; i++) {
      resultat += caractere.charAt(Math.floor(Math.random() * caractereLength));
    }
    return resultat;
  },
  differenceDays: (date1, date2) => {
    let resultat =
      (new Date(date2).getTime() - new Date(date1).getTime()) / 86400000;
    return resultat.toFixed(0);
  },
  generateNumber: (length) => {
    const caractere = "1234567890";
    let resultat = "";
    let caractereLength = caractere.length;
    for (let i = 0; i < length; i++) {
      resultat += caractere.charAt(Math.floor(Math.random() * caractereLength));
    }
    return resultat;
  },
  dateActuelle: (data) => {
    const jour = new Date(data);
    return `${jour.getDate()}/${jour.getMonth() + 1}/${jour.getFullYear()}`;
  },
  sla: (index) => {
    const now = new Date();
    const dateHours = (a, b) => (b - a) / 3600000;
    const diff = dateHours(
      new Date(FormaDate(index)),
      new Date(FormaDate(now))
    );
    return diff;
  },
  returnTime: (date1, date2) => {
    let resultat =
      (new Date(date2).getTime() - new Date(date1).getTime()) / 60000;
    if (resultat < 1) {
      return 1;
    } else {
      return resultat.toFixed(0);
    }
  },
};
