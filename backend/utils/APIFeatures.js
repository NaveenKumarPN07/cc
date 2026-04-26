/**
 * APIFeatures - Handles filtering, searching, sorting, and pagination
 * Used in product queries
 */

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filter by fields (exclude special query params)
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering: convert operators like gte, lte to MongoDB syntax
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Full-text search
   */
  search(fields = []) {
    if (this.queryString.search) {
      const keyword = this.queryString.search;

      // Use MongoDB text index if available
      if (fields.length === 0) {
        this.query = this.query.find({ $text: { $search: keyword } });
      } else {
        const searchQuery = {
          $or: fields.map((field) => ({
            [field]: { $regex: keyword, $options: 'i' },
          })),
        };
        this.query = this.query.find(searchQuery);
      }
    }
    return this;
  }

  /**
   * Sort results
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default: newest first
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * Select specific fields
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * Paginate results
   */
  paginate(defaultLimit = 12) {
    const page = Math.max(1, parseInt(this.queryString.page) || 1);
    const limit = Math.min(50, parseInt(this.queryString.limit) || defaultLimit);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

export default APIFeatures;
