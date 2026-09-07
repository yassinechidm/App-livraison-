import Colors from "@/constants/Colors";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function LegalTermsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pages Légales</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Conditions d'utilisation</Text>
        <Text style={styles.paragraph}>
          Bienvenue sur Quick Livraison. En utilisant notre service de livraison
          express à Oujda (وجدة), vous acceptez sans réserve les présentes
          conditions générales d'utilisation.
        </Text>
        <Text style={styles.paragraph}>
          1. **Description du Service** : Quick Livraison met en relation des
          clients, des livreurs et des commerces partenaires pour acheminer
          rapidement des repas, des courses et des colis.
        </Text>
        <Text style={styles.paragraph}>
          2. **Responsabilité** : Nous nous engageons à effectuer les livraisons
          dans les meilleurs délais possibles. Toutefois, les délais de
          livraison sont fournis à titre indicatif.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Politique de confidentialité</Text>
        <Text style={styles.paragraph}>
          La protection de vos données personnelles est une priorité pour nous.
        </Text>
        <Text style={styles.paragraph}>
          - **Collecte des données** : Nous collectons uniquement les
          informations indispensables au bon déroulement de votre livraison
          (nom, adresse de livraison, numéro de téléphone).
        </Text>
        <Text style={styles.paragraph}>
          - **Partage des données** : Vos coordonnées de contact ne sont
          partagées qu'avec le livreur assigné à votre commande en cours afin
          d'assurer son bon acheminement.
        </Text>
        <Text style={styles.paragraph}>
          - **Sécurité** : Toutes vos données sont stockées de façon sécurisée
          et cryptée via Supabase et nos infrastructures serveurs certifiées.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  scrollContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
});
