const { formatDistanceToNow } = require('date-fns');

const timeDifference = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

module.exports = timeDifference;
