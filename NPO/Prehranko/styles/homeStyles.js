import { StyleSheet, Dimensions } from 'react-native';
import { theme } from './theme';

const { width, height } = Dimensions.get('window');

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.large,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  settingsButton: {
    padding: theme.spacing.small,
  },
  settingsIcon: {
    fontSize: 24,
    color: theme.colors.accent,
  },
  userName: {
    fontSize: 18,
    color: theme.colors.text,
    marginVertical: theme.spacing.medium,
  },
  statisticsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 10,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: height * 0.35,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    width: '100%', // Full width
  },
  halfCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 10,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: height * 0.25, // Adjusted height for half cards
    width: '48%', // Half of the screen width with some spacing
    marginRight: theme.spacing.medium, // Space between cards
  },
  zajemiObrokCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  ciljiCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.large,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.large,
  },
  iconButtonContainer: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.medium,
  },
  iconButtonIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.small,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  iconButtonTitle: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
  },
});