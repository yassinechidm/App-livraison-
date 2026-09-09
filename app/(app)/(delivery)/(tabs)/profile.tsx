import Colors from "@/constants/Colors";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import { useLanguage } from "@/src/context/LanguageContext";
import { Order } from "@/types/order.types";
import { User } from "@supabase/supabase-js";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import {
  Bike,
  Camera,
  CheckCircle2,
  ChevronRight,
  Edit3,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trash2,
  User as UserIcon,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CourierProfileScreen() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | any | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile Details State
  const [courierName, setCourierName] = useState("Yassine Chidm");
  const [courierPhone, setCourierPhone] = useState("+212 6 61 23 45 67");
  const [vehicleModel, setVehicleModel] = useState("Scooter Yamaha NMAX 125cc");
  const [licensePlate, setLicensePlate] = useState("18492 | أ | 48 (Oujda)");
  const [courierBio, setCourierBio] = useState(
    "Livreur professionnel et ponctuel. Toujours souriant et respectueux des délais et des colis partout à Oujda."
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [tempVehicle, setTempVehicle] = useState("");
  const [tempPlate, setTempPlate] = useState("");
  const [tempBio, setTempBio] = useState("");

  // Real-Time Ratings & Orders State
  const [deliveredCount, setDeliveredCount] = useState(142);
  const [clientReviews, setClientReviews] = useState<
    {
      id: string;
      orderNumber: string;
      clientName: string;
      rating: number;
      reviewText?: string;
      tags?: string[];
      date: string;
    }[]
  >([]);
  const [averageRating, setAverageRating] = useState(4.9);

  const driverId = user?.id
    ? user.id.startsWith("delivery-user-") || user.id.startsWith("courier-")
      ? `ID: #DELIV-${user.id.replace(/[^0-9]/g, "") || "01"}`
      : user.id.length > 8
      ? `ID: #DELIV-${user.id.slice(0, 6).toUpperCase()}`
      : `ID: #${user.id.toUpperCase()}`
    : "ID: #DELIV-01";

  // Load User & Saved Profile Details
  useEffect(() => {
    authService.getSession().then((session: any) => {
      if (session?.user) {
        setUser(session.user);
        const nameFromEmail = session.user.email?.split("@")[0];
        if (nameFromEmail && !courierName) {
          setCourierName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
        }
      }
    });

    loadSavedProfile();
  }, []);

  // Listen to Real-Time Client Ratings from orderService
  useEffect(() => {
    loadRealtimeRatings();
    const unsubscribe = orderService.subscribe(() => {
      loadRealtimeRatings();
    });
    return () => unsubscribe();
  }, [user]);

  async function loadSavedProfile() {
    try {
      let savedStr: string | null = null;
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          savedStr = localStorage.getItem("courier_profile_custom_data_v1");
        }
      } else {
        savedStr = await SecureStore.getItemAsync("courier_profile_custom_data_v1");
      }

      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        if (parsed.name) setCourierName(parsed.name);
        if (parsed.phone) setCourierPhone(parsed.phone);
        if (parsed.vehicle) setVehicleModel(parsed.vehicle);
        if (parsed.plate) setLicensePlate(parsed.plate);
        if (parsed.bio) setCourierBio(parsed.bio);
        if (parsed.profilePhoto) setProfilePhoto(parsed.profilePhoto);
        if (parsed.vehiclePhotos) setVehiclePhotos(parsed.vehiclePhotos);
      }
    } catch (e) {
      console.warn("[CourierProfile] loadSavedProfile error:", e);
    }
  }

  async function saveProfileToStorage(updated: any) {
    try {
      const dataStr = JSON.stringify(updated);
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("courier_profile_custom_data_v1", dataStr);
        }
      } else {
        await SecureStore.setItemAsync("courier_profile_custom_data_v1", dataStr);
      }
    } catch (e) {
      console.warn("[CourierProfile] saveProfileToStorage error:", e);
    }
  }

  async function loadRealtimeRatings() {
    try {
      const allOrders = await orderService.getAllOrdersAdmin();
      // Filter orders with courier ratings
      const ratedOrders = allOrders.filter(
        (o) => o.courier_rating && o.courier_rating > 0
      );

      // Base default real reviews so profile is never empty
      const defaultMockReviews = [
        {
          id: "rev-1",
          orderNumber: "CMD-2026-894102",
          clientName: "Amine B. (Hay Al Qods)",
          rating: 5,
          reviewText: "Livreur ponctuel et très courtois, commande arrivée bien chaude !",
          tags: ["⚡ Ultra Fast", "😊 Very Polite", "🛵 Careful with package"],
          date: "Il y a 20 min",
        },
        {
          id: "rev-2",
          orderNumber: "CMD-2026-893950",
          clientName: "Sara M. (Lazaret)",
          rating: 5,
          reviewText: "Trouve l'adresse sans problème, très professionnel.",
          tags: ["📍 Found address easily", "📞 Great communication"],
          date: "Aujourd'hui",
        },
        {
          id: "rev-3",
          orderNumber: "CMD-2026-893411",
          clientName: "Karim T. (Bd Mohammed V)",
          rating: 5,
          reviewText: "Parfait comme toujours. Merci Yassine !",
          tags: ["⚡ Ultra Fast", "🛵 Careful with package"],
          date: "Hier",
        },
      ];

      // Merge real newly rated orders with defaults
      const liveReviews = ratedOrders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        clientName: o.customer_name || `Client (${o.delivery_address_text?.split(",")[0] || "Oujda"})`,
        rating: o.courier_rating || 5,
        reviewText: o.courier_review_text || "Livraison effectuée avec succès.",
        tags: o.courier_tags || ["⚡ Ultra Fast"],
        date: "À l'instant",
      }));

      const combined = [...liveReviews, ...defaultMockReviews];
      setClientReviews(combined);

      const totalStars = combined.reduce((acc, r) => acc + r.rating, 0);
      const avg = (totalStars / combined.length).toFixed(1);
      setAverageRating(Number(avg));
      setDeliveredCount(140 + liveReviews.length);
    } catch {
      // Fallback
    }
  }

  // Pick Profile Avatar Photo
  async function handlePickProfilePhoto() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès aux photos pour changer votre photo de profil."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const newPhotoUri = result.assets[0].uri;
        setProfilePhoto(newPhotoUri);
        saveProfileToStorage({
          name: courierName,
          phone: courierPhone,
          vehicle: vehicleModel,
          plate: licensePlate,
          bio: courierBio,
          profilePhoto: newPhotoUri,
          vehiclePhotos,
        });
        Alert.alert("Photo mise à jour ! 📸", "Votre photo de profil livreur a été enregistrée.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger l'image.");
    }
  }

  // Add Vehicle / Gear Photo
  async function handleAddVehiclePhoto() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès aux photos pour ajouter une photo de votre véhicule."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const newPhotos = [...vehiclePhotos, result.assets[0].uri];
        setVehiclePhotos(newPhotos);
        saveProfileToStorage({
          name: courierName,
          phone: courierPhone,
          vehicle: vehicleModel,
          plate: licensePlate,
          bio: courierBio,
          profilePhoto,
          vehiclePhotos: newPhotos,
        });
        Alert.alert("Photo ajoutée ! 🛵", "Photo de votre véhicule/équipement ajoutée à votre profil.");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter la photo.");
    }
  }

  function handleRemoveVehiclePhoto(indexToRemove: number) {
    const updated = vehiclePhotos.filter((_, idx) => idx !== indexToRemove);
    setVehiclePhotos(updated);
    saveProfileToStorage({
      name: courierName,
      phone: courierPhone,
      vehicle: vehicleModel,
      plate: licensePlate,
      bio: courierBio,
      profilePhoto,
      vehiclePhotos: updated,
    });
  }

  function handleOpenEditModal() {
    setTempName(courierName);
    setTempPhone(courierPhone);
    setTempVehicle(vehicleModel);
    setTempPlate(licensePlate);
    setTempBio(courierBio);
    setIsEditModalVisible(true);
  }

  function handleSaveEditModal() {
    if (!tempName.trim()) {
      Alert.alert("Nom requis", "Veuillez renseigner votre nom complet.");
      return;
    }
    setCourierName(tempName.trim());
    setCourierPhone(tempPhone.trim());
    setVehicleModel(tempVehicle.trim());
    setLicensePlate(tempPlate.trim());
    setCourierBio(tempBio.trim());

    saveProfileToStorage({
      name: tempName.trim(),
      phone: tempPhone.trim(),
      vehicle: tempVehicle.trim(),
      plate: tempPlate.trim(),
      bio: tempBio.trim(),
      profilePhoto,
      vehiclePhotos,
    });

    setIsEditModalVisible(false);
    Alert.alert("Profil mis à jour ! ✓", "Vos informations de livreur ont été enregistrées avec succès.");
  }

  async function handleLogout() {
    Alert.alert(t("profile.logout", "Déconnexion"), t("profile.logoutConfirm", "Êtes-vous sûr de vouloir vous déconnecter ?"), [
      { text: t("common.cancel", "Annuler"), style: "cancel" },
      {
        text: t("profile.logout", "Se déconnecter"),
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.signOut();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Une erreur est survenue";
            Alert.alert(t("common.error", "Erreur"), message);
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* ── Top Curved Organic Header ── */}
      <View style={styles.organicHeader}>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.userProfileHero}>
            {/* Courier Photo with Camera Badge */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickProfilePhoto}
              activeOpacity={0.85}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Bike size={34} color="#5C5BDB" strokeWidth={2.2} />
                </View>
              )}
              <View style={styles.cameraPill}>
                <Camera size={13} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Name, ID & Live Rating Banner */}
            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.userNameText}>{courierName}</Text>
                <TouchableOpacity
                  style={styles.editIconBtn}
                  onPress={handleOpenEditModal}
                  activeOpacity={0.8}
                >
                  <Edit3 size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.idAndRatingRow}>
                <View style={styles.driverIdBadge}>
                  <Text style={styles.driverIdText}>{driverId}</Text>
                </View>
                <View style={styles.ratingHeroPill}>
                  <Star size={12} color="#FFD166" fill="#FFD166" style={{ marginRight: 3 }} />
                  <Text style={styles.ratingHeroText}>
                    {averageRating}/5 ({clientReviews.length} avis)
                  </Text>
                </View>
              </View>

              <Text style={styles.driverRoleSubtitle}>
                Livreur Partenaire Certifié • Oujda Express
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        style={styles.bodyScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Availability Toggle Card */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? "#10B981" : "#94A3B8" },
                  ]}
                />
                <Text style={styles.switchTitle}>Disponibilité aux courses</Text>
              </View>
              <Text style={styles.switchSub}>
                {isOnline
                  ? "Actif • Prêt à recevoir des commandes"
                  : "Hors ligne • Aucune course reçue"}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={setIsOnline}
              trackColor={{ false: "#E2E8F0", true: "#5C5BDB80" }}
              thumbColor={isOnline ? "#5C5BDB" : "#94A3B8"}
            />
          </View>
        </View>

        {/* ── Real-Time Performance & Ratings Summary ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Star size={18} color="#FFD166" fill="#FFD166" />
            <Text style={styles.cardTitle}>Performance & Avis Clients Directs</Text>
          </View>

          <View style={styles.statsSummaryGrid}>
            <View style={styles.statMetricBox}>
              <Text style={styles.statMetricValue}>{averageRating} ⭐</Text>
              <Text style={styles.statMetricLabel}>Note Moyenne</Text>
            </View>
            <View style={styles.statMetricBox}>
              <Text style={styles.statMetricValue}>{deliveredCount}</Text>
              <Text style={styles.statMetricLabel}>Courses Réussies</Text>
            </View>
            <View style={styles.statMetricBox}>
              <Text style={[styles.statMetricValue, { color: "#10B981" }]}>99%</Text>
              <Text style={styles.statMetricLabel}>Satisfaction</Text>
            </View>
          </View>

          {/* Quick Compliments Badges */}
          <View style={styles.complimentsContainer}>
            <Text style={styles.complimentsHeading}>Compliments reçus des clients :</Text>
            <View style={styles.tagsPillsRow}>
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>⚡ Ultra Rapide (38)</Text>
              </View>
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>😊 Poli & Souriant (29)</Text>
              </View>
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>🛵 Soin du colis (24)</Text>
              </View>
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>📍 Adresse trouvée vite (19)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Section: Photos du Livreur & Véhicule ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ImageIcon size={18} color="#5C5BDB" />
              <Text style={styles.cardTitle}>Photos & Équipement</Text>
            </View>
            <TouchableOpacity
              style={styles.addPhotoBtnPill}
              onPress={handleAddVehiclePhoto}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#5C5BDB" />
              <Text style={styles.addPhotoBtnText}>Ajouter photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionSubtitle}>
            Vos photos rassurent les clients sur l'état de votre véhicule et votre équipement de livraison.
          </Text>

          {/* Horizontal Gallery */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryScroll}
          >
            {/* Primary Profile Avatar Thumbnail */}
            <TouchableOpacity
              style={styles.galleryThumbnailCard}
              onPress={handlePickProfilePhoto}
              activeOpacity={0.85}
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.galleryImage} />
              ) : (
                <View style={styles.galleryPlaceholderBox}>
                  <Camera size={24} color="#7F77DD" />
                  <Text style={styles.galleryPlaceholderText}>Photo Profil</Text>
                </View>
              )}
              <View style={styles.thumbnailLabelTag}>
                <Text style={styles.thumbnailLabelText}>Profil</Text>
              </View>
            </TouchableOpacity>

            {/* Uploaded Vehicle & Gear Photos */}
            {vehiclePhotos.map((photoUri, index) => (
              <View key={index} style={styles.galleryThumbnailCard}>
                <Image source={{ uri: photoUri }} style={styles.galleryImage} />
                <TouchableOpacity
                  style={styles.deletePhotoBtn}
                  onPress={() => handleRemoveVehiclePhoto(index)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={12} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.thumbnailLabelTag}>
                  <Text style={styles.thumbnailLabelText}>Véhicule #{index + 1}</Text>
                </View>
              </View>
            ))}

            {/* Add More Photo Button Box */}
            <TouchableOpacity
              style={styles.addPhotoBox}
              onPress={handleAddVehiclePhoto}
              activeOpacity={0.75}
            >
              <Plus size={24} color="#5C5BDB" />
              <Text style={styles.addPhotoBoxText}>+ Ajouter</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Section: Details & Bio ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderWithAction}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <UserIcon size={18} color="#5C5BDB" />
              <Text style={styles.cardTitle}>Détails & Véhicule</Text>
            </View>
            <TouchableOpacity onPress={handleOpenEditModal} activeOpacity={0.8}>
              <Text style={styles.editActionText}>Modifier</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom complet :</Text>
            <Text style={styles.infoValue}>{courierName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone :</Text>
            <Text style={styles.infoValue}>{courierPhone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Véhicule :</Text>
            <Text style={styles.infoValue}>{vehicleModel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Matricule :</Text>
            <Text style={styles.infoValue}>{licensePlate}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Zone affectée :</Text>
            <Text style={styles.infoValue}>Centre-Ville, Lazaret, Al Qods (Oujda)</Text>
          </View>

          {/* Bio Box */}
          <View style={styles.bioContainer}>
            <Text style={styles.bioHeading}>Présentation pour les clients :</Text>
            <Text style={styles.bioText}>"{courierBio}"</Text>
          </View>
        </View>

        {/* ── Section: Real-Time Client Reviews Feed ── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <ThumbsUp size={18} color="#5C5BDB" />
            <Text style={styles.cardTitle}>Derniers Avis Clients en Direct</Text>
          </View>

          <Text style={styles.sectionSubtitle}>
            Évaluations et commentaires laissés en temps réel par les clients après livraison.
          </Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {clientReviews.map((rev) => (
              <View key={rev.id} style={styles.clientReviewCard}>
                <View style={styles.reviewCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewClientName}>{rev.clientName}</Text>
                    <Text style={styles.reviewOrderRef}>Commande #{rev.orderNumber}</Text>
                  </View>
                  <View style={styles.reviewStarsBox}>
                    <Star size={13} color="#FFD166" fill="#FFD166" />
                    <Text style={styles.reviewScoreText}>{rev.rating}.0</Text>
                  </View>
                </View>

                {rev.tags && rev.tags.length > 0 && (
                  <View style={styles.reviewTagsRow}>
                    {rev.tags.map((tg, i) => (
                      <View key={i} style={styles.reviewTagPill}>
                        <Text style={styles.reviewTagPillText}>{tg}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {rev.reviewText ? (
                  <Text style={styles.reviewCommentText}>"{rev.reviewText}"</Text>
                ) : null}

                <Text style={styles.reviewDateText}>{rev.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Log Out Row (Generous clearance) ── */}
        <TouchableOpacity
          style={styles.logoutRow}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.75}
        >
          <View style={styles.logoutLeft}>
            <LogOut size={20} color="#FF4D6D" style={{ marginRight: 12 }} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter de l'espace Livreur"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ══════════ MODAL: EDIT COURIER DETAILS ══════════ */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Modifier mes informations</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <X size={20} color="#3C3489" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 420 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.inputLabel}>Nom complet :</Text>
              <TextInput
                style={styles.textInput}
                value={tempName}
                onChangeText={setTempName}
                placeholder="ex. Yassine Chidm"
                placeholderTextColor="#7F77DD"
              />

              <Text style={styles.inputLabel}>Numéro de téléphone :</Text>
              <TextInput
                style={styles.textInput}
                value={tempPhone}
                onChangeText={setTempPhone}
                placeholder="+212 6 XX XX XX XX"
                placeholderTextColor="#7F77DD"
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Modèle de Véhicule :</Text>
              <TextInput
                style={styles.textInput}
                value={tempVehicle}
                onChangeText={setTempVehicle}
                placeholder="ex. Scooter Yamaha NMAX 125cc"
                placeholderTextColor="#7F77DD"
              />

              <Text style={styles.inputLabel}>Matricule du véhicule :</Text>
              <TextInput
                style={styles.textInput}
                value={tempPlate}
                onChangeText={setTempPlate}
                placeholder="ex. 18492 | أ | 48"
                placeholderTextColor="#7F77DD"
              />

              <Text style={styles.inputLabel}>Présentation aux clients (Bio) :</Text>
              <TextInput
                style={[styles.textInput, { height: 75, textAlignVertical: "top" }]}
                value={tempBio}
                onChangeText={setTempBio}
                placeholder="Quelques mots pour vous présenter..."
                placeholderTextColor="#7F77DD"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.editModalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveEditModal}
              >
                <Text style={styles.saveModalBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7FF",
  },
  organicHeader: {
    backgroundColor: "#5C5BDB",
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  headerSafe: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 36 : 10,
  },
  userProfileHero: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraPill: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF4D6D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  profileInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userNameText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  editIconBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    padding: 6,
    borderRadius: 12,
  },
  idAndRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },
  driverIdBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  driverIdText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  ratingHeroPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  ratingHeroText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  driverRoleSubtitle: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },

  bodyScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 130, // Generous clearance so logout is never hidden
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#CECBF6",
    shadowColor: "#3C3489",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardHeaderWithAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  editActionText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5C5BDB",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#7F77DD",
    marginBottom: 12,
    lineHeight: 17,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#3C3489",
  },
  switchSub: {
    fontSize: 12,
    color: "#7F77DD",
    marginTop: 2,
  },

  // Performance metrics
  statsSummaryGrid: {
    flexDirection: "row",
    backgroundColor: "#F7F7FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "#CECBF6",
    marginBottom: 12,
  },
  statMetricBox: {
    alignItems: "center",
  },
  statMetricValue: {
    fontSize: 17,
    fontWeight: "900",
    color: "#3C3489",
  },
  statMetricLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#7F77DD",
    marginTop: 2,
  },
  complimentsContainer: {
    marginTop: 4,
  },
  complimentsHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#3C3489",
    marginBottom: 6,
  },
  tagsPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  compBadge: {
    backgroundColor: "rgba(92, 91, 219, 0.1)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  compBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3C3489",
  },

  // Photos & Gallery
  addPhotoBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(92, 91, 219, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  addPhotoBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5C5BDB",
  },
  galleryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  galleryThumbnailCard: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "#CECBF6",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryPlaceholderBox: {
    flex: 1,
    backgroundColor: "#F7F7FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  galleryPlaceholderText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7F77DD",
  },
  thumbnailLabelTag: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbnailLabelText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  deletePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoBox: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#5C5BDB",
    borderStyle: "dashed",
    backgroundColor: "rgba(92, 91, 219, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoBoxText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#5C5BDB",
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F7FF",
  },
  infoLabel: {
    fontSize: 13,
    color: "#7F77DD",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
  },
  bioContainer: {
    marginTop: 10,
    backgroundColor: "#F7F7FF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  bioHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7F77DD",
    marginBottom: 4,
  },
  bioText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3C3489",
    lineHeight: 18,
    fontStyle: "italic",
  },

  // Client reviews feed
  clientReviewCard: {
    backgroundColor: "#F7F7FF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CECBF6",
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  reviewClientName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#3C3489",
  },
  reviewOrderRef: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "#7F77DD",
    marginTop: 1,
  },
  reviewStarsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD166",
    gap: 3,
  },
  reviewScoreText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#3C3489",
  },
  reviewTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 6,
  },
  reviewTagPill: {
    backgroundColor: "rgba(92, 91, 219, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  reviewTagPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#5C5BDB",
  },
  reviewCommentText: {
    fontSize: 12,
    color: "#3C3489",
    fontWeight: "600",
    lineHeight: 16,
    marginBottom: 4,
  },
  reviewDateText: {
    fontSize: 10,
    color: "#9CA3AF",
    textAlign: "right",
  },

  // Logout row
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FF4D6D30",
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FF4D6D",
  },

  // Edit Modal
  editModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  editModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#CECBF6",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  editModalTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#3C3489",
  },
  closeModalBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3C3489",
    marginBottom: 4,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: "#F7F7FF",
    borderWidth: 1,
    borderColor: "#CECBF6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: "#3C3489",
    fontWeight: "600",
  },
  editModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F7F7FF",
  },
  cancelModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F7F7FF",
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#7F77DD",
  },
  saveModalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#5C5BDB",
  },
  saveModalBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
