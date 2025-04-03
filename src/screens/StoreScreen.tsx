import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Clipboard
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define store items with Bitcoin amounts and prices
interface StoreItem {
  id: string;
  name: string;
  description: string;
  btcAmount: number;
  pointsPrice: number;
  image: string;
}

const StoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const { score, highScore, coins, addCoins, removeCoins } = useGame();
  const [isLoading, setIsLoading] = useState(true);
  const [btcPrice, setBtcPrice] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null);
  const [isPriceUp, setIsPriceUp] = useState<boolean | null>(null);
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);
  const [btcAddress, setBtcAddress] = useState('');
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  // Ref for price update interval
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPriceRef = useRef<number | null>(null);

  useEffect(() => {
    // Fetch current Bitcoin price on mount
    fetchBitcoinPrice();
    
    // Generate store items
    generateStoreItems();
    
    // Load saved BTC address
    loadBtcAddress();
    
    // Set up interval to update price every 30 seconds
    priceUpdateIntervalRef.current = setInterval(() => {
      fetchBitcoinPrice(false);
    }, 30000); // 30 seconds
    
    // Clean up interval on unmount
    return () => {
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
    };
  }, []);

  const loadBtcAddress = async () => {
    try {
      const savedAddress = await AsyncStorage.getItem('btc_address');
      if (savedAddress) {
        setBtcAddress(savedAddress);
        setIsAddressSaved(true);
      }
    } catch (error) {
      console.error('Error loading BTC address:', error);
    }
  };

  const saveBtcAddress = async () => {
    try {
      if (btcAddress.trim().length < 26) {
        Alert.alert('Invalid Address', 'Please enter a valid Bitcoin address');
        return;
      }
      
      await AsyncStorage.setItem('btc_address', btcAddress);
      setIsAddressSaved(true);
      setIsEditingAddress(false);
      Alert.alert('Success', 'Bitcoin address saved successfully');
    } catch (error) {
      console.error('Error saving BTC address:', error);
      Alert.alert('Error', 'Failed to save Bitcoin address');
    }
  };

  const handleEditAddress = () => {
    setIsEditingAddress(true);
  };

  const handleCopyAddress = () => {
    Clipboard.setString(btcAddress);
    Alert.alert('Copied', 'Bitcoin address copied to clipboard');
  };

  const fetchBitcoinPrice = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshingPrice(true);
      }
      
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
      const data = await response.json();
      
      // Store previous price for comparison
      if (btcPrice > 0) {
        previousPriceRef.current = btcPrice;
      }
      
      const price = data.bitcoin.usd;
      const change24h = data.bitcoin.usd_24h_change || 0;
      
      setBtcPrice(price);
      setPriceChangePercent(change24h);
      
      // Determine if price went up or down compared to previous fetch
      if (previousPriceRef.current !== null) {
        setIsPriceUp(price > previousPriceRef.current);
      }
      
      console.log(`Current BTC price: $${price}, 24h change: ${change24h.toFixed(2)}%`);
      
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshingPrice(false);
      }
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      // Fallback price if API fails
      if (btcPrice === 0) {
        setBtcPrice(60000);
      }
      
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshingPrice(false);
      }
    }
  };

  const generateStoreItems = () => {
    // Generate store items with different BTC amounts and point prices
    const items: StoreItem[] = [
      {
        id: 'btc-micro',
        name: 'Micro Bitcoin',
        description: 'A tiny amount of Bitcoin to start your journey',
        btcAmount: 0.0001,
        pointsPrice: 150000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'btc-mini',
        name: 'Mini Bitcoin',
        description: 'A small piece of digital gold',
        btcAmount: 0.001,
        pointsPrice: 300000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'btc-small',
        name: 'Small Bitcoin',
        description: 'Building your crypto portfolio',
        btcAmount: 0.005,
        pointsPrice: 750000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'btc-medium',
        name: 'Medium Bitcoin',
        description: 'A significant amount of Bitcoin',
        btcAmount: 0.01,
        pointsPrice: 1500000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'btc-large',
        name: 'Large Bitcoin',
        description: 'Serious crypto investor level',
        btcAmount: 0.05,
        pointsPrice: 3000000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      },
      {
        id: 'btc-whale',
        name: 'Whale Bitcoin',
        description: 'Join the Bitcoin whales',
        btcAmount: 0.1,
        pointsPrice: 6000000,
        image: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'
      }
    ];
    
    setStoreItems(items);
  };

  const handlePurchase = (item: StoreItem) => {
    if (!isAddressSaved) {
      Alert.alert(
        "Bitcoin Address Required",
        "Please save your Bitcoin address before making a purchase.",
        [{ text: "OK", onPress: () => setIsEditingAddress(true) }]
      );
      return;
    }
    
    setSelectedItem(item);
    setShowConfirmModal(true);
  };

  const confirmPurchase = () => {
    if (!selectedItem) return;
    
    if (score < selectedItem.pointsPrice) {
      Alert.alert(
        "Insufficient Points",
        `You need ${selectedItem.pointsPrice} points to purchase this item. You have ${score} points.`,
        [{ text: "OK" }]
      );
      setShowConfirmModal(false);
      return;
    }
    
    // Calculate USD value
    const usdValue = selectedItem.btcAmount * btcPrice;
    
    // Purchase success message
    Alert.alert(
      "Purchase Successful!",
      `You have purchased ${selectedItem.btcAmount} BTC (worth $${usdValue.toFixed(2)})! It will be sent to your Bitcoin address.`,
      [{ text: "OK" }]
    );
    
    // Add bonus coins as a reward
    const bonusCoins = Math.floor(selectedItem.pointsPrice / 1000);
    addCoins(bonusCoins);
    
    setShowConfirmModal(false);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleRefreshPrice = () => {
    fetchBitcoinPrice(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bitcoin Store</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f7931a" />
          <Text style={styles.loadingText}>Loading Bitcoin prices...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bitcoin Store</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.priceHeader}>
                <Text style={styles.infoLabel}>Current BTC Price</Text>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={handleRefreshPrice}
                  disabled={isRefreshingPrice}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color="#f7931a" 
                    style={isRefreshingPrice ? styles.refreshingIcon : undefined}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.infoValue}>${formatNumber(btcPrice)}</Text>
              
              {priceChangePercent !== null && (
                <View style={styles.priceChangeContainer}>
                  <Ionicons 
                    name={priceChangePercent >= 0 ? "trending-up" : "trending-down"} 
                    size={14} 
                    color={priceChangePercent >= 0 ? "#16a34a" : "#dc2626"} 
                  />
                  <Text 
                    style={[
                      styles.priceChangeText, 
                      { color: priceChangePercent >= 0 ? "#16a34a" : "#dc2626" }
                    ]}
                  >
                    {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}% (24h)
                  </Text>
                </View>
              )}
              
              {isPriceUp !== null && (
                <View style={styles.realtimeChangeContainer}>
                  <Ionicons 
                    name={isPriceUp ? "arrow-up" : "arrow-down"} 
                    size={12} 
                    color={isPriceUp ? "#16a34a" : "#dc2626"} 
                  />
                  <Text 
                    style={[
                      styles.realtimeChangeText, 
                      { color: isPriceUp ? "#16a34a" : "#dc2626" }
                    ]}
                  >
                    {isPriceUp ? "Rising" : "Falling"}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.coinsContainer}>
            <Ionicons name="logo-bitcoin" size={24} color="#f59e0b" />
            <Text style={styles.coinsText}>{coins} coins</Text>
          </View>
          <Text style={styles.infoText}>
            Exchange your hard-earned points for Bitcoin!
          </Text>
        </View>
        
        {/* Bitcoin Address Section */}
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressTitle}>Your Bitcoin Address</Text>
            {isAddressSaved && !isEditingAddress && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditAddress}
              >
                <Ionicons name="pencil" size={16} color="#f7931a" />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditingAddress ? (
            <View style={styles.addressInputContainer}>
              <TextInput
                style={styles.addressInput}
                value={btcAddress}
                onChangeText={setBtcAddress}
                placeholder="Enter your Bitcoin address"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={saveBtcAddress}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : isAddressSaved ? (
            <View style={styles.savedAddressContainer}>
              <Text style={styles.savedAddressText} numberOfLines={1} ellipsizeMode="middle">
                {btcAddress}
              </Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={handleCopyAddress}
              >
                <Ionicons name="copy-outline" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.addAddressButton}
              onPress={() => setIsEditingAddress(true)}
            >
              <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
              <Text style={styles.addAddressText}>Add Bitcoin Address</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Available Bitcoin Packages</Text>
        
        {storeItems.map((item) => {
          const usdValue = item.btcAmount * btcPrice;
          const canAfford = score >= item.pointsPrice;
          
          return (
            <View 
              key={item.id} 
              style={[
                styles.itemCard,
                !canAfford && styles.itemCardDisabled
              ]}
            >
              <View style={styles.itemHeader}>
                <Image 
                  source={{ uri: item.image }} 
                  style={styles.itemImage} 
                  resizeMode="contain"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{item.btcAmount} BTC</Text>
                </View>
                <View style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>USD Value</Text>
                  <Text style={styles.detailValue}>${usdValue.toFixed(2)}</Text>
                </View>
                <View style={styles.itemDetail}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>{formatNumber(item.pointsPrice)} points</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.purchaseButton,
                  !canAfford && styles.purchaseButtonDisabled
                ]}
                onPress={() => handlePurchase(item)}
                disabled={!canAfford}
              >
                <LinearGradient
                  colors={canAfford ? ['#f7931a', '#e67e22'] : ['#6b7280', '#4b5563']}
                  style={styles.purchaseButtonGradient}
                >
                  <FontAwesome5 name="bitcoin" size={16} color="#ffffff" />
                  <Text style={styles.purchaseButtonText}>
                    {canAfford ? 'Purchase' : 'Not Enough Points'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>
            
            {selectedItem && (
              <>
                <View style={styles.modalItem}>
                  <Image 
                    source={{ uri: selectedItem.image }} 
                    style={styles.modalItemImage} 
                    resizeMode="contain"
                  />
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                </View>
                
                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Amount:</Text>
                    <Text style={styles.modalDetailValue}>{selectedItem.btcAmount} BTC</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>USD Value:</Text>
                    <Text style={styles.modalDetailValue}>
                      ${(selectedItem.btcAmount * btcPrice).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Cost:</Text>
                    <Text style={styles.modalDetailValue}>
                      {formatNumber(selectedItem.pointsPrice)} points
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalAddressContainer}>
                  <Text style={styles.modalAddressLabel}>Sending to:</Text>
                  <Text style={styles.modalAddressValue} numberOfLines={1} ellipsizeMode="middle">
                    {btcAddress}
                  </Text>
                </View>
                
                <Text style={styles.modalMessage}>
                  Are you sure you want to purchase {selectedItem.btcAmount} BTC for {formatNumber(selectedItem.pointsPrice)} points?
                </Text>
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmPurchase}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d2d',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  infoCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoItem: {
    alignItems: 'center',
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginRight: 6,
  },
  refreshButton: {
    padding: 4,
  },
  refreshingIcon: {
    transform: [{ rotate: '45deg' }],
  },
  infoValue: {
    color: '#f7931a',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  priceChangeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  realtimeChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  realtimeChangeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 16,
  },
  coinsText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 8,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  // Bitcoin Address Card
  addressCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressInput: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#f7931a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  savedAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savedAddressText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
  },
  copyButton: {
    padding: 4,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addAddressText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemCardDisabled: {
    opacity: 0.6,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemImage: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDescription: {
    color: '#9ca3af',
    fontSize: 14,
  },
  itemDetails: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  itemDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  purchaseButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  purchaseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalItemImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  modalItemName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalDetails: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalDetailLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  modalDetailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalAddressContainer: {
    backgroundColor: 'rgba(247, 147, 26, 0.1)',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f7931a',
  },
  modalAddressLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  modalAddressValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalMessage: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#f7931a',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default StoreScreen;
