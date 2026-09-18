# -*- coding: utf-8 -*-
"""Bo tham so cua ban du toan MCN 36 thang.

Nguon: docs/mcn/gia-dinh-don-vi-ip.csv + gia-dinh-don-vi-ip.md (bo gia dinh don vi/IP).
Cac tham so tang cong ty (BOD, BD, back office, van phong...) la gia dinh bo sung
cua ban du toan nay, duoc danh dau NGUON = "Dự toán" trong cot ghi chu.
"""

N = 36
SCEN_NAMES = ["Downside", "Base", "Upside"]

# (key, nhan, don vi, downside, base, upside, ghi chu/nguon)
SECTIONS = [
 ("A. KẾ HOẠCH ĐỘI HÌNH IP (quyết định của công ty)", [
  ("hire1",  "Số IP người thật ký mới / tháng — T1-T6",  "IP/tháng", 2, 2, 3, "Dự toán: năng lực casting + ươm tạo giai đoạn đầu"),
  ("hire2",  "Số IP người thật ký mới / tháng — T7-T18", "IP/tháng", 2, 3, 4, "Dự toán: tăng khi quy trình ươm tạo chạy ổn định"),
  ("hire3",  "Số IP người thật ký mới / tháng — T19-T36","IP/tháng", 2, 3, 4, "Dự toán"),
  ("ai_start","Tháng bắt đầu ra mắt IP AI",              "tháng",   15, 13, 11, "Dự toán: sau khi có đủ dữ liệu bán hàng từ IP người thật"),
  ("ai_hire1","Số IP AI ra mắt / tháng — 12 tháng đầu",  "IP/tháng", 3, 5, 8, "Dự toán"),
  ("ai_hire2","Số IP AI ra mắt / tháng — giai đoạn sau", "IP/tháng", 5, 10, 16, "Dự toán"),
 ]),
 ("B. CƠ CHẾ SÀNG LỌC & RƠI RỤNG IP NGƯỜI THẬT", [
  ("gate1_m",   "Cửa sàng lọc 1 — tuổi IP (tháng)",        "tháng", 3, 3, 3, "Unit econ: chuyển cửa về T2 tiết kiệm ~126tr mỗi 10 IP tuyển"),
  ("gate1_drop","% IP bị loại tại cửa 1",                  "%",   0.45, 0.30, 0.20, "Unit econ mục 6: 30% IP bị loại ở cửa tháng 3 (base)"),
  ("gate2_m",   "Cửa sàng lọc 2 — tuổi IP (tháng)",        "tháng", 9, 9, 9, "Dự toán: cắt IP chưa đạt lãi gộp dương trước khi vào ổn định"),
  ("gate2_drop","% IP bị loại tại cửa 2",                  "%",   0.35, 0.15, 0.05, "Dự toán: cơ chế cắt bắt buộc vì IP dưới ~35tr GMV/phiên không bao giờ hoàn vốn"),
  ("attr_y",    "Tỷ lệ IP rời bỏ / năm sau khi ổn định",   "%/năm", 0.25, 0.15, 0.10, "Unit econ: 15%/năm (base)"),
  ("ai_attr_y", "Tỷ lệ IP AI ngừng hoạt động / năm",       "%/năm", 0.40, 0.25, 0.15, "Dự toán: rủi ro nền tảng siết nội dung AI"),
 ]),
 ("C. DOANH THU CHUNG", [
  ("ret",      "Tỷ lệ huỷ & hoàn hàng — IP người thật", "% GMV gộp", 0.25, 0.18, 0.13, "Unit econ mục 4: base 18% (10% huỷ + 8% hoàn)"),
  ("comm",     "Hoa hồng affiliate từ nhãn hàng",       "% GMV ròng", 0.15, 0.20, 0.24, "Unit econ mục 1: dải 12-30%, tuỳ ngành hàng"),
  ("book_fee", "Phí booking cố định mỗi phiên",         "triệu/phiên", 0, 0, 10, "Unit econ: 5-15tr/phiên với IP đã có tên tuổi; base để 0"),
  ("book_from","Tuổi IP bắt đầu thu phí booking",       "tháng", 10, 10, 10, "Unit econ mục 1"),
  ("bonus",    "Thưởng đạt target của nhãn hàng/sàn",   "% GMV ròng", 0, 0, 0.02, "Unit econ: 1-3% theo chiến dịch; base để 0"),
 ]),
 ("D. VÒNG ĐỜI 1 IP NGƯỜI THẬT", [
  ("build_that","Chi phí dựng IP một lần (tuổi 0)", "triệu/IP", 80, 60, 55, "Unit econ mục 3: casting 8 + đào tạo 15 + nhận diện 20 + thưởng ký 15 + pháp lý 2"),
  ("gmv_s1", "GMV/phiên — ươm (tuổi 1-3)",            "triệu", 5,    10, 18,  "Unit econ mục 2"),
  ("ses_s1", "Số phiên/tháng — ươm",                  "phiên", 12,   12, 12,  "Unit econ mục 2"),
  ("gmv_s2", "GMV/phiên — tăng trưởng sớm (tuổi 4-6)","triệu", 12.5, 25, 46,  "Unit econ mục 2"),
  ("ses_s2", "Số phiên/tháng — tăng trưởng sớm",      "phiên", 16,   16, 16,  "Unit econ mục 2"),
  ("gmv_s3", "GMV/phiên — tăng trưởng (tuổi 7-9)",    "triệu", 20,   40, 73,  "Unit econ mục 2"),
  ("ses_s3", "Số phiên/tháng — tăng trưởng",          "phiên", 18,   18, 18,  "Unit econ mục 2"),
  ("gmv_s4", "GMV/phiên — ổn định (tuổi 10+)",        "triệu", 30,   60, 110, "Unit econ mục 8: biến quyết định sống còn, dưới 35tr không hoàn vốn"),
  ("ses_s4", "Số phiên/tháng — ổn định",              "phiên", 20,   20, 20,  "Unit econ mục 2: 4 giờ/phiên"),
 ]),
 ("E. CHI PHÍ 1 IP NGƯỜI THẬT / THÁNG", [
  ("sal_inc",  "Lương cứng talent — ươm (tuổi 1-3)",      "triệu/tháng", 12, 12, 12, "Unit econ mục 3"),
  ("sal_st",   "Lương cứng talent — từ tuổi 4",           "triệu/tháng", 15, 15, 15, "Unit econ mục 3: thị trường thuê ngoài 15-50tr"),
  ("share_tal","Chia hoa hồng cho talent",                "% DT từ IP",  0.30, 0.30, 0.28, "Unit econ mục 1: dải 25-35%, là quyết định thương mại"),
  ("crew",     "Ê-kíp nội dung + ê-kíp live phân bổ",     "triệu/tháng", 27, 27, 27, "Unit econ mục 3: 1 ê-kíp 3 người ~40tr phục vụ 1,5 IP"),
  ("studio",   "Studio, thiết bị, phần mềm phân bổ",      "triệu/tháng", 6, 6, 6,   "Unit econ mục 3: 1 studio ~18tr phục vụ 3 IP theo ca"),
  ("ads_s1",   "Quảng cáo kéo view — ươm",                "% GMV ròng",  0.08, 0.08, 0.08, "Unit econ script: LIFECYCLE giai đoạn 1"),
  ("ads_s2",   "Quảng cáo kéo view — tăng trưởng sớm",    "% GMV ròng",  0.05, 0.05, 0.05, "Unit econ script: LIFECYCLE giai đoạn 2"),
  ("ads_s3",   "Quảng cáo kéo view — tăng trưởng",        "% GMV ròng",  0.04, 0.04, 0.04, "Unit econ script: LIFECYCLE giai đoạn 3"),
  ("ads_s4",   "Quảng cáo kéo view — ổn định",            "% GMV ròng",  0.03, 0.03, 0.03, "Unit econ script: LIFECYCLE giai đoạn 4"),
  ("sample",   "Mẫu sản phẩm, đạo cụ, phát sinh",         "triệu/tháng", 3, 3, 3, "Unit econ mục 3"),
 ]),
 ("F. 1 IP AI", [
  ("ai_build", "Chi phí dựng IP AI một lần",              "triệu/IP", 30, 30, 30, "Unit econ mục 7: nhân vật + voice + persona + tích hợp"),
  ("ai_ramp",  "Số tháng ramp trước khi bán được",        "tháng", 2, 1, 0, "Unit econ: 6 / 4 / 2 tuần tương ứng downside-base-upside"),
  ("ai_gmv_h", "GMV mỗi giờ live",                        "triệu/giờ", 0.8, 1.5, 2.5, "Unit econ mục 8: tham số ít dữ liệu công khai nhất"),
  ("ai_hours", "Số giờ live mỗi ngày",                    "giờ", 10, 12, 14, "Unit econ mục 7"),
  ("ai_days",  "Số ngày live mỗi tháng",                  "ngày", 26, 26, 26, "Unit econ mục 7"),
  ("ai_ret",   "Tỷ lệ huỷ & hoàn hàng — IP AI",           "% GMV gộp", 0.25, 0.22, 0.20, "Unit econ mục 7: cao hơn IP người thật"),
  ("ai_comm",  "Hoa hồng affiliate — IP AI",              "% GMV ròng", 0.18, 0.20, 0.22, "Unit econ script: AI_SCENARIOS"),
  ("ai_lic",   "License & compute / IP AI / tháng",       "triệu/tháng", 6, 8, 10, "Unit econ mục 7"),
  ("ai_ops",   "Vận hành & trực chat / IP AI / tháng",    "triệu/tháng", 10, 12, 14, "Unit econ mục 7: 1 người phụ trách 3-5 IP AI"),
  ("ai_ads",   "Quảng cáo kéo view — IP AI",              "% GMV ròng", 0.05, 0.05, 0.04, "Unit econ script: AI_SCENARIOS"),
  ("ai_other", "Chi phí khác / IP AI / tháng",            "triệu/tháng", 2, 2, 2, "Unit econ script: AI_SCENARIOS"),
 ]),
 ("G. CHI PHÍ TẦNG CÔNG TY (không phân bổ vào unit economics)", [
  ("hc_bod",    "Số BOD / quản lý cấp cao",              "người", 3, 3, 3, "Dự toán"),
  ("sal_bod",   "Lương BOD / quản lý cấp cao",           "triệu/người", 50, 50, 50, "Dự toán"),
  ("ratio_bd",  "Số IP người thật / 1 BD tìm nhãn hàng", "IP/người", 8, 8, 8, "Dự toán"),
  ("sal_bd",    "Lương BD / sales nhãn hàng",            "triệu/người", 20, 20, 20, "Dự toán"),
  ("ratio_rec", "Số IP ký mới một tháng / 1 tuyển dụng", "IP/người", 4, 4, 4, "Dự toán: phễu ~30 ứng viên cho 1 IP được chọn"),
  ("sal_rec",   "Lương tuyển dụng & đào tạo",            "triệu/người", 15, 15, 15, "Dự toán"),
  ("tech_lead", "Số tháng tuyển đội công nghệ trước IP AI","tháng", 3, 3, 3, "Dự toán"),
  ("tech_base", "Số kỹ sư công nghệ nền",                "người", 2, 2, 2, "Dự toán"),
  ("ratio_tech","Số IP AI / 1 kỹ sư bổ sung",            "IP/người", 20, 20, 20, "Dự toán"),
  ("sal_tech",  "Lương kỹ sư AI / công nghệ",            "triệu/người", 45, 45, 45, "Dự toán: mức thị trường VN"),
  ("bo_base",   "Số back office tối thiểu",              "người", 2, 2, 2, "Dự toán"),
  ("ratio_bo",  "Số nhân sự / 1 back office bổ sung",    "người/người", 25, 25, 25, "Dự toán"),
  ("sal_bo",    "Lương back office (kế toán, HR, HC)",   "triệu/người", 15, 15, 15, "Dự toán"),
  ("burden",    "Phụ cấp trên lương (BHXH, thưởng)",     "% lương", 0.25, 0.25, 0.25, "BHXH/BHYT/BHTN phần DN ~21,5% + thưởng/phúc lợi"),
  ("mkt_brand", "Marketing thương hiệu MCN & tuyển IP",  "triệu/tháng", 100, 100, 100, "Dự toán: khác với quảng cáo kéo view đã tính trong unit"),
  ("tech_fixed","Công nghệ & nền tảng dùng chung",       "triệu/tháng", 80, 80, 80, "Dự toán: phần mềm quản lý, data"),
  ("office",    "Văn phòng",                             "triệu/tháng", 60, 60, 60, "Dự toán"),
  ("ga_fixed",  "Pháp lý, kế toán, kiểm toán",           "triệu/tháng", 25, 25, 25, "Dự toán"),
  ("ga_pct",    "Chi phí chung khác theo doanh thu",     "% doanh thu", 0.03, 0.03, 0.03, "Dự toán"),
  ("dev_capex", "Thiết bị cho 1 nhân sự tầng công ty",   "triệu/người", 12, 12, 12, "Dự toán"),
  ("depr_m",    "Số tháng khấu hao",                     "tháng", 36, 36, 36, "Khấu hao đường thẳng"),
 ]),
 ("H. VỐN LƯU ĐỘNG, THUẾ & GỌI VỐN", [
  ("dso",     "Số ngày thu tiền hoa hồng (DSO)",  "ngày", 60, 45, 30, "Sàn/nhãn hàng đối soát và trả sau 30-60 ngày"),
  ("dpo",     "Số ngày trả chia sẻ cho talent (DPO)", "ngày", 15, 15, 15, "Trả talent sau khi đối soát"),
  ("tax",     "Thue TNDN",                       "%", 0.20, 0.20, 0.20, "Thuế suất phổ thông VN, có chuyển lỗ"),
  ("cash0",   "Tiền mặt đầu kỳ",                 "triệu", 0, 0, 0, ""),
  ("raise1",  "Vốn góp vòng 1",                  "triệu", 30000, 30000, 30000, "Sheet Kich_ban: nhu cầu vốn đỉnh điểm base ~31,8 tỷ tại T28"),
  ("raise1_m","Tháng giải ngân vòng 1",          "tháng", 1, 1, 1, ""),
  ("raise2",  "Vốn góp vòng 2",                  "triệu", 12000, 12000, 12000, "Tranche 2 sau khi chứng minh unit economics (cohort đầu đã hoà vốn)"),
  ("raise2_m","Tháng giải ngân vòng 2",          "tháng", 19, 19, 19, ""),
 ]),
 ("I. KIỂM ĐỊNH RỦI RO: CÚ SỐC CHÍNH SÁCH NỀN TẢNG VỚI TẦNG AI", [
  ("shock_pct",  "% GMV tầng IP AI bị mất",     "%", 0, 0, 0, "Unit econ mục 7: nên chạy thử kịch bản mất 60% GMV tầng AI trong một quý"),
  ("shock_from", "Tháng bắt đầu cú sốc",        "tháng", 25, 25, 25, "Đặt 0% ở trên để tắt kiểm định"),
  ("shock_len",  "Số tháng kéo dài cú sốc",     "tháng", 3, 3, 3, ""),
 ]),
]

PARAMS = {}
for _s, _items in SECTIONS:
    for k, lab, unit, d, b, u, note in _items:
        PARAMS[k] = {"label": lab, "unit": unit, "vals": (d, b, u), "note": note}

def scen(name):
    """Tra ve dict {key: value} cho mot kich ban."""
    i = SCEN_NAMES.index(name)
    return {k: v["vals"][i] for k, v in PARAMS.items()}
