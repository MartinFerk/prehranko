// styles/homeStyles.js
import { StyleSheet, Dimensions } from 'react-native';
import { theme } from './theme';

const { height } = Dimensions.get('window'); // Za dinamično izračunavanje višine

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Svetlo bež ozadje
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
    color: theme.colors.primary, // Rumena za naslov aplikacije
  },
  settingsButton: {
    padding: theme.spacing.small,
  },
  settingsIcon: {
    fontSize: 24,
    color: theme.colors.accent, // Temno oranžna za ikono nastavitev
  },
  userName: {
    fontSize: 18,
    color: theme.colors.text, // Temno siva za ime uporabnika
    marginVertical: theme.spacing.medium,
  },
  statisticsCard: {
    backgroundColor: theme.colors.cardBackground, // Bela kartica
    borderRadius: 10,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: height * 0.35, // 35% višine zaslona
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary, // Svetlo oranžna za poudarek
  },
  card: {
    backgroundColor: theme.colors.cardBackground, // Bela kartica
    borderRadius: 10,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary, // Rumena za poudarek
    height: height * 0.15, // Manjše kartice (15% višine zaslona)
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text, // Temno siva za naslove
    marginBottom: theme.spacing.small,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.text, // Temno siva za opis
  },
  cardsContainer: {
    flex: 1,
    marginBottom: theme.spacing.large,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.large,
  },
  // Stili za IconButton
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
    borderColor: theme.colors.accent, // Temno oranžna za rob gumbov
  },
  iconButtonTitle: {
    fontSize: 12,
    color: theme.colors.text, // Temno siva za tekst gumbov
    textAlign: 'center',
  },
});