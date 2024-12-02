import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import {
  getTicket,
  updatePaymentMethod,
} from "../../screens/CreateticketsScreen/showticket";
import { Image } from "react-native"; // Đảm bảo nhập đúng Image từ react-native
import Header from "../../components/header";
import { styles, pickerSelectStyles } from "./style";
import { payment } from "../../../src/data/data";
import RNPickerSelect from "react-native-picker-select";
import AntDesign from "@expo/vector-icons/AntDesign";
import { Dropdown } from "react-native-element-dropdown";
import { Linking } from "react-native"; // Đảm bảo nhập đúng
type ItemType = {
  label: string; // Nếu `label` là chuỗi
  value: string | number; // Nếu `value` có thể là chuỗi hoặc số
  icon?: any;
};
const SuccessScreen = ({ route }: any) => {
  const { ticket } = route.params;
  const idticket = ticket._id; //"674064e71ba977f5828b3b04"
  const [ticketData, setTicketData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // State cho RefreshControl
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<string>(""); // Đảm bảo giá trị mặc định không phải là null

  const [timeLeft, setTimeLeft] = useState(600); // Đếm ngược từ 600 giây (10 phút)
  const token = "your-auth-token";
  /*  console.log("Dữ liệu trả về", ticketData); */

  // Chuyển đổi thời gian còn lại thành phút và giây
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await getTicket(idticket, token);
      setTicketData(data);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError("Không thể tải thông tin vé.");
      setLoading(false);
    }
  };

  // Xử lý khi kéo để làm mới
  const onRefresh = useCallback(async () => {
    setRefreshing(true); // Bật trạng thái refreshing
    setTicketData(null); // Reset lại dữ liệu vé
    setError(null); // Reset lỗi

    try {
      // Gọi lại API để tải lại thông tin vé
      const data = await getTicket(idticket, token);
      setTicketData(data); // Cập nhật dữ liệu vé mới
      setError(null); // Reset lỗi nếu có
    } catch (err) {
      setError("Không thể tải lại thông tin vé."); // Hiển thị thông báo lỗi nếu không tải được dữ liệu
    } finally {
      setRefreshing(false); // Tắt trạng thái refreshing
    }
  }, [idticket, token]);

  useEffect(() => {
    fetchTicket();

    // Thiết lập timer đếm ngược 10 phút (600 giây)
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer); // Dừng đếm ngược khi hết thời gian
          onRefresh(); // Gọi lại để làm mới trang sau khi hết 10 phút
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000); // Cập nhật mỗi giây

    // Cleanup khi component unmount
    return () => clearInterval(timer);
  }, [onRefresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!ticketData) {
    return <View style={styles.center}></View>;
  }

  // Các hàm định dạng
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  const formatLicensePlate = (licensePlate: string) => {
    // Biểu thức chính quy để chia biển số thành các phần
    const regex = /^(\d{2})([a-zA-Z])(\d{3})(\d{2})$/;
    const regexFourDigit = /^(\d{2})([a-zA-Z])(\d{4})$/; // Đối với biển số có 4 chữ số

    const match = licensePlate.match(regex);
    const matchFourDigit = licensePlate.match(regexFourDigit);

    if (match) {
      // Định dạng cho trường hợp biển số có 3 chữ số sau
      return `${match[1]}${match[2].toUpperCase()}-${match[3]}.${match[4]}`;
    } else if (matchFourDigit) {
      // Định dạng cho trường hợp biển số có 4 chữ số sau
      return `${matchFourDigit[1]}${matchFourDigit[2].toUpperCase()}-${
        matchFourDigit[3]
      }`;
    }

    // Nếu không khớp với bất kỳ định dạng nào, trả về biển số gốc
    return licensePlate;
  };
  // Hàm xử lý hiển thị tình trạng vé
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "CHƯA XÁC NHẬN THANH TOÁN";
      case "PAID":
        return "ĐÃ THANH TOÁN";
      case "PAYMENTPENDING":
        return "CHỜ THANH TOÁN";
      case "CANCELED":
        return "VÉ BỊ HỦY";
      case "PAYMENT_FAILED":
        return "THANH TOÁN THẤT BẠI";
      default:
        return "Tình trạng không xác định";
    }
  };
  const getpaymentMethodText = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "OFFLINEPAYMENT":
        return "TẠI BẾN - XE";
      case "ZALOPAY":
        return "ZALO PAY";
      default:
        return "Tình trạng không xác định";
    }
  };

  // Hàm xử lý màu sắc của tình trạng vé
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "#00796b"; // Màu xanh dương cho đã thanh toán
      case "PENDING":
        return "#FFB200"; // Màu cam cho chưa thanh toán
      case "PAYMENTPENDING":
        return "#EB5B00"; // Màu cam cho chưa thanh toán
      case "CANCELED":
        return "#d32f2f"; // Màu đỏ cho bị hủy
      case "PAYMENT_FAILED":
        return "#f44336"; // Màu đỏ cho thất bại thanh toán
      default:
        return "#000000"; // Màu đen mặc định
    }
  };
  /* start các hàm của chọn phương thức thanh toán */

  const renderItem = (item: ItemType) => {
    return (
      <View style={styles.item}>
        <Image source={item.icon} style={styles.iconImage} />
        <Text style={styles.textItem}>{item.label}</Text>
        {/* Hiển thị icon */}
        {item.value === value && (
          <AntDesign
            style={styles.icon}
            color="#9ABF80"
            name="check"
            size={24}
          />
        )}
      </View>
    );
  };
  // Lọc icon theo giá trị đã chọn
  const selectedPayment = payment.find((item) => item.value === value);
  const selectedIcon = selectedPayment ? selectedPayment.icon : null;
  /* end */

  /* Nút thanh toán */
  const handlePaymentUpdate = async () => {
    try {
      console.log(value); // Phương thức thanh toán đã chọn
      console.log(ticket._id); // ID của vé
      console.log(token); // Token xác thực

      // Gửi phương thức thanh toán lên API
      const result = await updatePaymentMethod(ticket._id, value, token);
      console.log("Payment method updated successfully:", result);

      // Kiểm tra nếu phương thức thanh toán là ZALOPAY, lấy URL thanh toán
      if (value === "ZALOPAY" && result && result.order_url) {
        // Mở URL thanh toán ZaloPay trong trình duyệt di động
        Linking.openURL(result.order_url).catch((err) => {
          console.error("Failed to open URL:", err);
        });
      }

      // Bạn có thể làm gì đó sau khi thành công, ví dụ điều hướng người dùng hoặc thông báo
    } catch (error) {
      console.error("Failed to update payment method:", error);
    }
  };
  /* end */
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header title="Xuất vé và thanh toán" />
      <View style={styles.ticketBox}>
        {/* Tiêu đề chính */}
        <Text style={styles.mainTitle}>Chi tiết vé được đặt</Text>

        {/* Phần 1: Thông tin về nhà xe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chuyến đi</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Mã vé:</Text>
            <Text style={styles.lableMaVe}>{ticketData.code}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Chuyến xe:</Text>
            <Text style={styles.value}>
              {ticketData.trip.route.startProvince} -{" "}
              {ticketData.trip.route.endProvince}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Điểm xuất phát:</Text>
            <Text style={styles.value}>{ticketData.boardingPoint}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Điểm đến:</Text>
            <Text style={styles.value}>{ticketData.dropOffPoint}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian xuất phát:</Text>
            <Text style={styles.value}>
              {formatDateTime(ticketData.trip.departureTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Thời gian dự kiến đến:</Text>
            <Text style={styles.value}>
              {formatDateTime(ticketData.trip.arrivalTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Vị trí ghế:</Text>
            <View style={styles.numberSeat}>
              {ticketData.seatNumber.map((seat: any, index: any) => (
                <View key={index} style={styles.selectedSeatBox}>
                  <Text style={styles.selectedSeatText}>{seat}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Biển số xe:</Text>
            <Text style={styles.value}>
              {formatLicensePlate(ticketData.bus.licensePlate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tình trạng vé:</Text>
            <Text
              style={[
                styles.value2,
                { color: getStatusColor(ticketData.status) },
              ]}
            >
              {getStatusText(ticketData.status)}
            </Text>
          </View>
        </View>

        {/* Đoạn đường gạch nét đứt với logo */}
        <View style={styles.dashedLineContainer}>
          <Image
            source={require("../../../assets/logo1_DaTachNen2.png")} // Thay thế bằng đường dẫn tới logo của bạn
            style={styles.watermarkLogo}
          />
          <View style={styles.dashedLine}></View>
        </View>

        {/* Phần 2: Thông tin khách hàng */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tên khách hàng:</Text>
            <Text style={styles.value}>{ticketData.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Số điện thoại:</Text>
            <Text style={styles.value}>{ticketData.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ghi chú:</Text>
            <Text style={styles.value}>{ticketData.note || "Không có"}</Text>
          </View>
        </View>

        {/* Phần 3: Chi phí chuyến xe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi phí chuyến xe</Text>
          <View style={styles.infoRow}>
            <Text style={styles.labelTolal}>Tổng tiền:</Text>
            <Text style={styles.valueHighlight}>
              {formatCurrency(ticketData.totalAmount)} VND
            </Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phương thức thanh toán:</Text>
              <Text style={styles.value}>
                {getpaymentMethodText(ticketData.paymentMethod) || "Không có"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.viewtwo}>
        <View style={styles.containerTime}>
          <View style={styles.sectionTime}>
            <Text style={styles.lableTime}>Thời gian giữ vé còn lại </Text>
            <Text style={styles.countdownText}>
              {minutes < 10 ? `0${minutes}` : minutes}:
              {seconds < 10 ? `0${seconds}` : seconds}
            </Text>
          </View>
        </View>
        <View style={styles.sectionPay}>
          <Text style={styles.sectionTitlePay}>Phương thức thanh toán: </Text>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={payment}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Chọn phương thức thanh toán"
            value={value}
            onChange={(item) => {
              setValue(item.value);
              console.log("Người dùng đã chọn:", item);
            }}
            renderLeftIcon={() =>
              // Hiển thị icon khi có giá trị được chọn
              selectedIcon ? (
                <Image style={styles.selectedIcon} source={selectedIcon} />
              ) : null
            }
            renderItem={renderItem}
          />
        </View>
        {/* Phần 4: Đếm ngược */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handlePaymentUpdate} // Gọi hàm gửi dữ liệu lên API khi nhấn nút
          >
            <Text style={styles.buttonText}>Thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default SuccessScreen;
