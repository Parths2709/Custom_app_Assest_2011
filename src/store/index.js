'use strict';

let _seq = 1;
const nextId = () => String(_seq++);

const categories = new Map();
const subCategories = new Map();
const specifications = new Map();
const assets = new Map();
const assetCounters = new Map();
const activityHistory = [];
const employees = new Map();
const jobCards = new Map();
const notifications = new Map();
const users = new Map();

module.exports = {
  nextId,
  categories,
  subCategories,
  specifications,
  assets,
  assetCounters,
  activityHistory,
  employees,
  jobCards,
  notifications,
  users,
};
