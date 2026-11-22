export type UserSearchField = 'email' | 'displayName';
export type UserSortField = 'email' | 'displayName' | 'createdAt';

export class FindUsersQueryDto {
  search?: string;
  searchBy?: UserSearchField;
  sort?: {
    sortBy: UserSortField;
    sortOrder: 'ASC' | 'DESC';
  };
  page?: string;
  limit?: string;
}
