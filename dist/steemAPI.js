'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var steem = require('steem');

steem.api.setOptions({ url: 'http://rpc.buildteam.io/' });

function getContent(author, permlink) {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getContent(author, permlink, function (e, p) {
      if (e) return reject(e);
      resolve(p);
    });
  });
}

function getContentReplies(author, permlink) {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getContentReplies(author, permlink, function (e, p) {
      if (e) return reject(e);
      resolve(p);
    });
  });
}

function getAccountHistory(account, start, limit) {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getAccountHistory(account, start, limit, function (e, p) {
      if (e) return reject(e);
      resolve(p);
    });
  });
}

function getDiscussionsByBlog(query) {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getDiscussionsByBlog(query, function (e, props) {
      if (e) return reject(e);
      resolve(props);
    });
  });
}

function getDynamicGlobalProperties() {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getDynamicGlobalProperties(function (e, props) {
      if (e) return reject(e);
      resolve(props);
    });
  });
}

function getAccounts(accounts) {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getAccounts(accounts, function (e, accs) {
      if (e) return reject(e);
      resolve(accs);
    });
  });
}

function getCurrentMedianHistoryPrice() {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getCurrentMedianHistoryPrice(function (e, price) {
      if (e) return reject(e);
      resolve(price);
    });
  });
}

function getRewardFund() {
  return new _promise2.default(function (resolve, reject) {
    steem.api.getRewardFund('post', function (e, fund) {
      if (e) return reject(e);
      resolve(fund);
    });
  });
}

function vote(activeKey, voter, author, permlink, weight) {
  return new _promise2.default(function (resolve, reject) {
    steem.broadcast.vote(activeKey, voter, author, permlink, weight, function (e, voted) {
      if (e) return reject(e);
      resolve(voted);
    });
  });
}

function comment(activeKey, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata) {
  return new _promise2.default(function (resolve, reject) {
    steem.broadcast.comment(activeKey, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata, function (e, commented) {
      if (e) return reject(e);
      resolve(commented);
    });
  });
}

module.exports = {
  getContent: getContent,
  getAccountHistory: getAccountHistory,
  getDiscussionsByBlog: getDiscussionsByBlog,
  getDynamicGlobalProperties: getDynamicGlobalProperties,
  getAccounts: getAccounts,
  getCurrentMedianHistoryPrice: getCurrentMedianHistoryPrice,
  getRewardFund: getRewardFund,
  vote: vote,
  comment: comment,
  getContentReplies: getContentReplies
};