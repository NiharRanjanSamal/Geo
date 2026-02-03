/**
 * Network utility functions
 * In production, use @react-native-community/netinfo
 */

let isOnline = true;

export function setOnlineStatus(online: boolean) {
  isOnline = online;
}

export function getOnlineStatus(): boolean {
  return isOnline;
}

// Placeholder for network listener
// In production, implement with @react-native-community/netinfo:
/*
import NetInfo from '@react-native-community/netinfo';

NetInfo.addEventListener(state => {
  setOnlineStatus(state.isConnected ?? false);
});
*/
