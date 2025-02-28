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

const _ = require("lodash");

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
  ReturnDelai_Issue: (fullDateSave, minutes) => {
    let resultat =
      (new Date().getTime() - new Date(fullDateSave).getTime()) / 60000;
    if (resultat > minutes) {
      return "OUT SLA";
    } else {
      return "IN SLA";
    }
  },
  return_time_Delai: (statut, deedline) => {
    try {
      const datetime = new Date();
      const a = _.filter(deedline, { plainte: statut });
      if (a.length > 0) {
        //si la plainte existe je cherche le jour
        let critere = a[0].critere.filter((x) => x.jour === datetime.getDay());
        if (critere.length > 0) {
          //si le critere existe
          let debutHeure = critere[0].debut.split(":")[0];
          let debutMinutes = critere[0].debut.split(":")[1];
          if (
            datetime.getHours() > parseInt(debutHeure) ||
            (datetime.getHours() === parseInt(debutHeure) &&
              datetime.getMinutes() >= parseInt(debutMinutes))
          ) {
            return critere[0]?.delai;
          } else {
            return a[0]?.defaut;
          }
        } else {
          return a[0]?.defaut;
        }
      } else {
        return 0;
      }
    } catch (error) {
      console.log(error);
    }
  },
  returnMoisLetter: (month) => {
    let main;
    switch (month) {
      case "01":
        main = "Jan";
        break;
      case "02":
        main = "Feb";
        break;
      case "03":
        main = "Mar";
        break;
      case "04":
        main = "Apr";
        break;
      case "05":
        main = "May";
        break;
      case "06":
        main = "Jun";
        break;
      case "07":
        main = "Jul";
        break;
      case "08":
        main = "Aug";
        break;
      case "09":
        main = "Sep";
        break;
      case "10":
        main = "Oct";
        break;
      case "11":
        main = "Nov";
        break;
      case "12":
        main = "Dec";
        break;
      default:
        main = "Invalid month";
        break;
    }
    return main;
  },
  returnLastFirstDate: (date) => {
    const currentDate = new Date(date);
    const lastMonthDate = new Date(currentDate);
    lastMonthDate.setMonth(currentDate.getMonth() - 1);
    const l = lastMonthDate.toISOString().split("T")[0];
    const lastDate = new Date(l);
    lastMonthDate.setDate(1);
    const f = lastMonthDate.toISOString().split("T")[0];
    const firstDate = new Date(f);
    return { lastDate, firstDate };
  },
};
