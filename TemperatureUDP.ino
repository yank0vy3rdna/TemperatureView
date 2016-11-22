#include <OneWire.h> //OneWire библиотека
#include <DallasTemperature.h>//Библиотека работы с датчиками
#include <SPI.h>// Без этого не работает, не убирать!
#include <Ethernet.h>//Еthernet библиотека
#include <EthernetUdp.h>//Библиотека UDP 
#define UDP_RX_PACKET_MAX_SIZE_MY 30 //размер буфера приема
#define UDP_TX_PACKET_MAX_SIZE_MY 30 //размер буфера передачи
#define ONE_WIRE_BUS 6//Шина данных на 6 пину
#define TEMPERATURE_PRECISION 12 //Разрешение сигнала: 12 бит
#define PORT 8888 //порт ардуины и сервера
byte mac[] = {0xDE, 0xAD, 0xCE, 0xEF, 0xFE, 0xEF }; //mac - адрес ethernet shielda
byte ip[] = {192, 168, 1, 77 };        // ip адрес ethernet shielda
byte subnet[] = {255, 255, 255, 0 }; //маска подсети
byte gateway[] = {192, 168, 1, 1 }; //шлюз
// Инициализация
OneWire oneWire(ONE_WIRE_BUS);
EthernetUDP Udp;
DallasTemperature sensors(&oneWire);
DeviceAddress Thermometer[20]; // массив, содержащий адреса датчиков
int devcount; //кол-во датчиков

void setup(void)
{
  // Инициализация ETHERNET
  Ethernet.begin(mac, ip, subnet, gateway);
  // Инициализация UDP
  Udp.begin(PORT);
  // Инициализация Serial
  Serial.begin(9600);
  // Инициализация датчиков
  sensors.begin();
  devcount = sensors.getDeviceCount();
  Serial.print(devcount, DEC);
  oneWire.reset_search();
  for (int i = 0; i < devcount; i++) {
    oneWire.search(Thermometer[i]);
    sensors.setResolution(Thermometer[i], TEMPERATURE_PRECISION);
    Serial.print("Device ");
    Serial.print(i);
    Serial.print("Address: ");
    printAddress(Thermometer[i]);
    Serial.println();
    Serial.print("Device ");
    Serial.print(i);
    Serial.print("Resolution: ");
    Serial.print(sensors.getResolution(Thermometer[i]), DEC);
    Serial.println();
  }
}

// функция печати адреса
void printAddress(DeviceAddress deviceAddress)
{
  for (uint8_t i = 0; i < 8; i++)
  {
    // zero pad the address if necessary
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}

// функция печати температуры
void printTemperature(DeviceAddress deviceAddress)
{
  float tempC = sensors.getTempC(deviceAddress);
  Serial.print("Temp C: ");
  Serial.println(tempC);
}

// функция печати разрешения датчика
void printResolution(DeviceAddress deviceAddress)
{
  Serial.print("Resolution: ");
  Serial.print(sensors.getResolution(deviceAddress));
  Serial.println();
}

// печать всего
void printData(DeviceAddress deviceAddress)
{
  Serial.print("Device Address: ");
  printAddress(deviceAddress);
  Serial.print(" ");
  printTemperature(deviceAddress);
  Serial.println();
}

void loop()
{
  byte ReplyBuffer[UDP_TX_PACKET_MAX_SIZE_MY]; // Буфер передатчика - данные которые отправятся в пакет UDP

  int packetSize = Udp.parsePacket();

  for (int i = 0; i < UDP_TX_PACKET_MAX_SIZE_MY; i++) {//Обнуление буфера
    ReplyBuffer[i] = 0;
  }

  if (packetSize == 4) {
    
    IPAddress remote = Udp.remoteIP(); //Сохраняю IP сервера

    sensors.requestTemperatures();//Запрашиваю датчики
    
    Serial.println(" --- ");
    
    printTemperature(Thermometer[1]);
    
    float tempC = sensors.getTempC(Thermometer[1]); //Запрос температуры

    byte znak = 0;
    
    if (tempC > 0) {
      znak = 1;
    } else {
      tempC = tempC * -1;
    }
    
    byte cel = (byte)tempC;//Целое значение
    
    byte drob = (byte)((tempC - cel) * 100); //Дробное значение
    
    ReplyBuffer[0] = cel;
    ReplyBuffer[1] = drob;
    ReplyBuffer[2] = znak;

    Serial.println(" --- ");
    
    Udp.beginPacket(remote, PORT);//отправка
    Udp.write(ReplyBuffer, UDP_TX_PACKET_MAX_SIZE_MY);
    Udp.endPacket();
    
  }else if (packetSize != 0) //если пришел пакет, читаю его
  {

    IPAddress remote = Udp.remoteIP(); //Сохраняю IP сервера

    sensors.requestTemperatures();//Запрашиваю датчики
    Serial.println(" --- ");
    for (int i = 0; i < devcount; i++)//Формирую пакет
    {
      printTemperature(Thermometer[i]);
      float tempC = sensors.getTempC(Thermometer[i]);

      byte znak = 0;
      if (tempC > 0) {
        znak = 1;
      } else {
        tempC = tempC * -1;
      }
      byte cel = (byte)tempC;
      byte drob = (byte)((tempC - cel) * 100);
      ReplyBuffer[i * 3] = cel;
      ReplyBuffer[(i * 3) + 1] = drob;
      ReplyBuffer[(i * 3) + 2] = znak;

    }

    Serial.println(" --- ");
    ReplyBuffer[devcount * 3 + 3] = devcount;
    Udp.beginPacket(remote, PORT);//отправка
    Udp.write(ReplyBuffer, UDP_TX_PACKET_MAX_SIZE_MY);
    Udp.endPacket();
  }
}
