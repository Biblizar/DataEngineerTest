import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const isLatLonExist = await prisma.$queryRaw`select *
                                                 from INFORMATION_SCHEMA.COLUMNS
                                                 where TABLE_NAME='address'
                                                 and COLUMN_NAME="latitude"
                                                 or COLUMN_NAME="longitude"`;
  if (Object.keys(isLatLonExist).length === 0) {
    await prisma.$queryRaw`ALTER TABLE dataengineer.address 
                       ADD latitude VARCHAR(255), 
                       ADD longitude VARCHAR(255)`;
  }
  const allAddress = await prisma.$queryRaw`SELECT * 
                                       FROM dataengineer.address 
                                       WHERE latitude IS NULL and longitude IS NULL`;
  const dataNotUpdated = [];
  for (const [key, value] of Object.entries(allAddress)) {
    const { address, address_id, city, postal_code } = value;
    try {
      const resp = await axios.get(
        `https://nominatim.openstreetmap.org/search?street=${address}&countrycodes="fr"&country="France"&city=${city}&postalcode=${postal_code}&format=jsonv2`
      );
      if (resp.data[0]?.lat) {
        await prisma.$queryRaw`UPDATE dataengineer.address 
                               SET longitude = ${resp.data[0].lon}, latitude= ${resp.data[0].lat} 
                               WHERE address_id = ${address_id}`;
      } else {
        //console.log(value.address_id," not updated")
        dataNotUpdated.push(value);
      }
    } catch (error) {
      console.error(error);
    }
  }
  console.warn(dataNotUpdated.length, "entries not updated");
  console.warn(dataNotUpdated);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.info("disconnected");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
