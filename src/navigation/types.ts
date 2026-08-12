export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  Households: { inviteCode?: string } | undefined;
  HouseholdDetail: { householdId: string };
};
