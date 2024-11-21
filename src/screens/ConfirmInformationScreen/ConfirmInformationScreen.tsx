// src/screens/app/ConfirmInformation.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Header from "../../components/header";
import { Ionicons } from "@expo/vector-icons";
import { createTicket } from "./ticketmodel"; // Import hàm API
import { getPromotionByCode } from "./ticketmodel"; // Import hàm API

const ConfirmInformation: React.FC = ({ route }: any) => {
  const { selectedSeats, trip, seatCapacity } = route.params;

  console.log(selectedSeats);
  console.log(trip);

  // State để lưu giá trị input
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [note, setNote] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [finalDiscountValue, setFinalDiscountValue] = useState(0);
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);

  // State để kiểm tra tính hợp lệ của số điện thoại
  const [phoneValid, setPhoneValid] = useState(true);

  // Hàm kiểm tra số điện thoại hợp lệ (chỉ kiểm tra 10 chữ số và không có ký tự đặc biệt)
  const validatePhoneNumber = (number: string) => {
    // Kiểm tra số điện thoại có 10 chữ số và không có ký tự đặc biệt
    const regex = /^[0-9]{10}$/; // Chỉ cho phép 10 chữ số
    if (regex.test(number)) {
      setPhoneValid(true);
    } else {
      setPhoneValid(false);
    }
  };

  // Hàm xử lý khi nhập số điện thoại
  const handlePhoneChange = (number: string) => {
    setPhoneNumber(number);
    validatePhoneNumber(number); // Kiểm tra tính hợp lệ mỗi khi người dùng thay đổi
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString); // Tạo đối tượng Date từ chuỗi ISO
    const hours = date.getUTCHours().toString().padStart(2, "0"); // Lấy giờ và đảm bảo 2 chữ số
    const minutes = date.getUTCMinutes().toString().padStart(2, "0"); // Lấy phút và đảm bảo 2 chữ số
    return `${hours}:${minutes}`; // Trả về giờ và phút
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0"); // Lấy giờ hiện tại
    const minutes = date.getMinutes().toString().padStart(2, "0"); // Lấy phút hiện tại
    const day = date.getDate().toString().padStart(2, "0"); // Ngày hiện tại
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Tháng hiện tại
    const year = date.getFullYear(); // Năm hiện tại
    return `${hours}:${minutes} - ${day}/${month}/${year}`; // Trả về ngày giờ đầy đủ
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDiscount = async () => {
    if (!discountCode.trim()) {
      // Kiểm tra mã giảm giá có rỗng hay không
      alert("Vui lòng nhập mã giảm giá!"); // Hiển thị thông báo yêu cầu nhập mã
      return; // Dừng thực hiện nếu mã giảm giá trống
    }

    try {
      const token = "người dùng của bạn"; // Thay bằng cách lấy token thực tế
      const promotionData = await getPromotionByCode(discountCode, token);
      console.log(promotionData);

      if (promotionData) {
        let discount = 0;
        if (promotionData.discountType === "AMOUNT") {
          discount = promotionData.discountAmount;
        } else if (promotionData.discountType === "PERCENT") {
          discount =
            (promotionData.discountAmount / 100) *
            (selectedSeats.length * trip.price);
        }

        setFinalDiscountValue(discount); // Lưu giá trị giảm giá vào state
        setIsDiscountApplied(true); // Đánh dấu đã áp dụng mã giảm giá
        console.log("Giá trị giảm giá cuối cùng: ", discount);
      }
    } catch (error: any) {
      // Kiểm tra nếu lỗi có response từ server
      if (error.response) {
        // Lỗi từ server, in ra thông báo lỗi từ server
        console.error("Lỗi từ server: ", error.response.data);
        alert(
          `Lỗi: ${
            error.response.data.message ||
            "Đã xảy ra lỗi khi áp dụng mã giảm giá."
          }`
        );
      } else if (error.request) {
        // Nếu không có phản hồi từ server (lỗi mạng, timeout, v.v.)
        console.error("Không có phản hồi từ server: ", error.request);
        alert("Không thể kết nối đến server. Vui lòng thử lại.");
      } else {
        // Lỗi khác (ví dụ lỗi cú pháp hoặc lỗi không xác định)
        console.error("Lỗi không xác định: ", error.message);
        alert("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
    }
  };

  const handleRemoveDiscount = () => {
    setIsDiscountApplied(false); // Hủy mã giảm giá
    setDiscountCode(""); // Xóa mã giảm giá
    setFinalDiscountValue(0); // Reset giá trị giảm giá
  };

  const Handlesticketcreation = async () => {
    try {
      // Dữ liệu gửi tới API
      const ticketData = {
        customerPhone: phoneNumber,
        customerName: fullName,
        note,
        trip: trip._id, // ID chuyến xe
        seatNumber: selectedSeats, // Danh sách ghế
        boardingPoint: trip.route.startDistrict,
        dropOffPoint: trip.route.endDistrict,
        discountCode, // Mã giảm giá
      };

      // Token người dùng (giả sử đã lưu trong AsyncStorage hoặc context)
      const token = "người dùng của bạn"; // Thay bằng cách lấy token thực tế

      // Gọi API
      const response = await createTicket(ticketData, token);

      console.log(response);

      // Điều hướng người dùng về trang chính
      // navigation.navigate("SuccessScreen"); // Điều chỉnh theo thực tế
    } catch (error: any) {
      // Kiểm tra nếu lỗi có response từ server
      if (error.response) {
        // Lỗi từ server, in ra thông báo lỗi từ server
        console.error("Lỗi từ server: ", error.response.data);
        alert(
          `Lỗi: ${
            error.response.data.message ||
            "Đã xảy ra lỗi khi áp dụng mã giảm giá."
          }`
        );
      } else if (error.request) {
        // Nếu không có phản hồi từ server (lỗi mạng, timeout, v.v.)
        console.error("Không có phản hồi từ server: ", error.request);
        alert("Không thể kết nối đến server. Vui lòng thử lại.");
      } else {
        // Lỗi khác (ví dụ lỗi cú pháp hoặc lỗi không xác định)
        console.error("Lỗi không xác định: ", error.message);
        alert("Đã xảy ra lỗi không xác định. Vui lòng thử lại.");
      }
    }
  };
  return (
    <View style={styles.container}>
      <Header title="Chọn ghế xe" />
      <View style={styles.inputSection}>
        <Text style={styles.inputTitle}>Họ và Tên</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="person-outline"
            size={24}
            color="#FF6347"
            style={styles.icon}
          />
          <TextInput
            placeholder="Nhập Họ và Tên"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>

        <Text style={styles.inputTitle}>Số điện thoại</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="call-outline"
            size={24}
            color="#FF6347"
            style={styles.icon}
          />
          <TextInput
            style={[!phoneValid && styles.inputError]} // Thêm style lỗi nếu không hợp lệ
            placeholder="Nhập Số điện thoại"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
          />
        </View>
        {!phoneValid && (
          <Text style={styles.errorText}>
            Số điện thoại phải có 10 chữ số và không có ký tự đặc biệt.
          </Text>
        )}

        <Text style={styles.inputTitle}>Ghi chú</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="clipboard-outline"
            size={24}
            color="#FF6347"
            style={styles.icon}
          />
          <TextInput
            style={[{ height: 80 }]}
            placeholder="Nhập Ghi chú"
            value={note}
            onChangeText={setNote}
            multiline
          />
        </View>

        <Text style={styles.inputTitle}>Mã giảm giá</Text>
        <View style={styles.discountSection}>
          <View style={styles.discountInputWrapper}>
            <Ionicons
              name="pricetag-outline"
              size={24}
              color="#FF6347"
              style={styles.icon}
            />
            <TextInput
              style={[
                styles.discountInput,
                isDiscountApplied && styles.discountAppliedInput,
              ]} // Thêm style khi đã áp dụng
              placeholder="Nhập mã giảm giá"
              value={discountCode}
              onChangeText={(text) => setDiscountCode(text.toUpperCase())} // Chuyển đổi thành chữ in hoa
              editable={!isDiscountApplied} // Không cho sửa nếu mã giảm giá đã được áp dụng
            />
          </View>
          <TouchableOpacity
            style={[
              styles.discountButton,
              { backgroundColor: isDiscountApplied ? "red" : "#005C78" }, // Nền đỏ khi Hủy mã, nền #005C78 khi Áp dụng mã
            ]}
            onPress={isDiscountApplied ? handleRemoveDiscount : handleDiscount}
          >
            <Text
              style={[
                styles.discountButtonText,
                { color: "white" }, // Chữ luôn là màu trắng
              ]}
            >
              {isDiscountApplied ? "Hủy mã" : "Áp dụng mã"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.heading}>Thông tin chuyến đi</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Thời gian xuất phát:</Text>
          <Text style={styles.detailText}>
            {formatDateTime(trip.departureTime)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Chuyến xe:</Text>
          <Text style={styles.detailText}>
            {trip.route.startProvince} - {trip.route.endProvince}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Điểm xuất phát:</Text>
          <Text
            style={[styles.detailText, styles.wrapText]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {trip.route.startDistrict}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Điểm đến:</Text>
          <Text style={styles.detailText}>{trip.route.endDistrict}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Số ghế đã chọn:</Text>
          <Text style={styles.detailText}>{selectedSeats.join(", ")}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Tổng tiền thanh toán:</Text>
          <Text style={styles.detailText}>
            {formatCurrency(
              selectedSeats.length * trip.price - finalDiscountValue
            )}{" "}
            - VND
          </Text>
        </View>
      </View>
      <View style={styles.confirmSection}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            Handlesticketcreation();
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inputSection: {
    margin: 20,
    flex: 6,
    justifyContent: "space-evenly",
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    flex: 1,
    height: 45,
    fontSize: 16,
    paddingLeft: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  discountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  discountInputWrapper: {
    flexDirection: "row",
    flex: 7,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingLeft: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  discountInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    paddingLeft: 10,
    borderWidth: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  discountButton: {
    flex: 3,
    backgroundColor: "#FF6347",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginLeft: 10,
  },
  discountButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  selectedSeats: {
    fontSize: 18,
    marginVertical: 10,
    color: "#666",
  },
  details: {
    fontSize: 16,
    marginVertical: 10,
    color: "#999",
  },
  confirmSection: {
    flex: 1,
    margin: 20,
    justifyContent: "center",
  },
  confirmButton: {
    backgroundColor: "#32CD32",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoSection: {
    padding: 16,
    margin: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  boldText: {
    fontWeight: "bold",
    color: "#333",
    fontSize: 16,
  },
  detailText: {
    fontSize: 16,
    color: "#666",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#555",
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007BFF",
    textAlign: "right",
  },
  wrapText: {
    flexWrap: "wrap", // Cho phép xuống dòng khi văn bản quá dài
  },
  discountAppliedInput: {
    backgroundColor: "#f0f0f0", // Màu xám nhạt
    color: "#555", // Màu chữ tối
  },
});

export default ConfirmInformation;
