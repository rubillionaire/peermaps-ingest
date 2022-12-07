// item id's are unique for each feature type, so we
// must include it in the item key to ensure they
// are unique.
module.exports = function osmItemKey (item) {
  return `${item.type}:${item.id}`
}
